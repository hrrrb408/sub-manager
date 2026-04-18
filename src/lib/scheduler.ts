import * as cron from "node-cron";
import { checkAndNotify } from "./notify";
import { prisma } from "./prisma";

let notifyTask: cron.ScheduledTask | null = null;

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

  console.log("[Scheduler] 定时任务已启动 (通知检查)");
}

export function stopScheduler() {
  if (notifyTask) {
    notifyTask.stop();
    notifyTask = null;
  }
}
