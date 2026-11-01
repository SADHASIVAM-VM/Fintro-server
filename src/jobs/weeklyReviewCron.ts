import cron from 'node-cron';
import { sendWeeklyReviewToAllUsers } from '../services/weeklyReview.service';

/**
 * Initializes the Sunday Weekly Review Cron Job
 * Runs every Sunday at 8:00 PM (20:00) in Asia/Kolkata timezone
 */
export const initWeeklyReviewCron = () => {
  const cronExpression = process.env.WEEKLY_REVIEW_CRON || '0 20 * * 0';
  const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

  console.log(`[Cron] Initializing Weekly Review Reminder scheduler (${cronExpression}, TZ: ${timezone})...`);

  cron.schedule(
    cronExpression,
    async () => {
      console.log(`[Cron] Sunday Weekly Review trigger executed at ${new Date().toISOString()}`);
      try {
        await sendWeeklyReviewToAllUsers();
      } catch (error: any) {
        console.error('[Cron] Error during weekly review execution:', error.message);
      }
    },
    {
      timezone,
      noOverlap: true,
    }
  );

  console.log('[Cron] Weekly Review Reminder scheduler active.');
};
