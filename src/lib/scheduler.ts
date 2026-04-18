import * as cron from "node-cron";
import { checkAndNotify } from "./notify";
import { scanEmailsForUser } from "./email-scanner";
import { prisma } from "./prisma";

let notifyTask: cron.ScheduledTask | null = null;
let emailScanTask: cron.ScheduledTask | null = null;

export function startScheduler() {
  stopScheduler();

  // Notification check: every minute, execute at configured hour
  notifyTask = cron.schedule("* * * * *", async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (minute !== 0) return;

    try {
      const configs = await prisma.notificationConfig.findMany({
        where: { checkHour: hour },
      });

      for (const config of configs) {
        try {
          const result = await checkAndNotify(config.userId);
          if (result.sent > 0) {
            console.log(`[Scheduler] 已发送 ${result.sent} 条通知 (用户 ${config.userId})`);
          }
        } catch (error) {
          console.error(`[Scheduler] 用户 ${config.userId} 通知任务失败:`, error);
        }
      }
    } catch (error) {
      console.error("[Scheduler] 通知任务失败:", error);
    }
  });

  // Email scan: daily at 3 AM
  emailScanTask = cron.schedule("0 3 * * *", async () => {
    try {
      const connections = await prisma.emailConnection.findMany({
        where: { scanEnabled: true },
        select: { userId: true },
        distinct: ["userId"],
      });

      for (const { userId } of connections) {
        try {
          const result = await scanEmailsForUser(userId);
          if (result.found > 0) {
            console.log(`[EmailScan] 用户 ${userId}: 发现 ${result.found} 条订阅`);
          }
        } catch (error) {
          console.error(`[EmailScan] 用户 ${userId} 扫描失败:`, error);
        }
      }
    } catch (error) {
      console.error("[EmailScan] 定时扫描失败:", error);
    }
  });

  console.log("[Scheduler] 定时任务已启动 (通知 + 邮件扫描)");
}

export function stopScheduler() {
  if (notifyTask) {
    notifyTask.stop();
    notifyTask = null;
  }
  if (emailScanTask) {
    emailScanTask.stop();
    emailScanTask = null;
  }
}
