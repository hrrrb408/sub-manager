import * as cron from "node-cron";
import { checkAndNotify } from "./notify";
import { prisma } from "./prisma";

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * 读取数据库中的 checkHour，启动/重启定时任务。
 * 每分钟检查一次，只在配置的小时执行通知。
 */
export function startScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  scheduledTask = cron.schedule("* * * * *", async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 只在每小时的第 0 分钟检查
    if (minute !== 0) return;

    try {
      const config = await prisma.notificationConfig.findUnique({
        where: { id: "default" },
      });
      if (!config) return;

      const targetHour = config.checkHour ?? 9;
      if (hour === targetHour) {
        console.log(`[Scheduler] 执行定时检查 (每天 ${targetHour}:00)...`);
        const result = await checkAndNotify();
        if (result.sent > 0) {
          console.log(`[Scheduler] 已发送 ${result.sent} 条通知`);
        }
        if (result.errors.length > 0) {
          console.error("[Scheduler] 错误:", result.errors);
        }
      }
    } catch (error) {
      console.error("[Scheduler] 定时任务执行失败:", error);
    }
  });

  console.log("[Scheduler] 定时检查已启动");
}

export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Scheduler] 定时检查已停止");
  }
}
