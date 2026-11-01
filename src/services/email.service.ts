import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WeeklyReviewTemplateData {
  userName: string;
  weekRange: string;
  currency: string;
  todaySpend: number;
  thisWeekSpend: number;
  prevWeekSpend: number;
  percentChange: number | null;
  isIncrease: boolean;
  topCategory: {
    name: string;
    amount: number;
    percentage: number;
    color?: string;
  } | null;
  topExpenses: Array<{
    title: string;
    amount: number;
    date: string;
    categoryName?: string;
  }>;
  monthlyBudget?: {
    limit: number;
    spentThisMonth: number;
    percentage: number;
  } | null;
  appUrl?: string;
}

// Create Nodemailer Transporter
export const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[EmailService] SMTP credentials not fully configured in environment variables.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
};

// Send Email Helper
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@fintro.app';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });

    console.log(`[EmailService] Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[EmailService] Failed to send email to ${options.to}:`, error.message);
    throw error;
  }
};

// Generate HTML Template for Weekly Review
export const generateWeeklyReviewEmailHtml = (data: WeeklyReviewTemplateData): string => {
  const {
    userName,
    weekRange,
    currency,
    todaySpend,
    thisWeekSpend,
    prevWeekSpend,
    percentChange,
    isIncrease,
    topCategory,
    topExpenses,
    monthlyBudget,
    appUrl = process.env.APP_CLIENT_URL || 'http://localhost:5173',
  } = data;

  const formattedThisWeek = `${currency}${thisWeekSpend.toLocaleString()}`;
  const formattedToday = `${currency}${todaySpend.toLocaleString()}`;
  const formattedPrevWeek = `${currency}${prevWeekSpend.toLocaleString()}`;

  // Percentage badge styling
  let changeBadgeHtml = '';
  if (percentChange === null || prevWeekSpend === 0) {
    changeBadgeHtml = `<span style="display:inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #f4f4f5; color: #71717a;">First active week</span>`;
  } else if (percentChange === 0) {
    changeBadgeHtml = `<span style="display:inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #f4f4f5; color: #71717a;">0% vs last week</span>`;
  } else if (isIncrease) {
    changeBadgeHtml = `<span style="display:inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #ffe4e6; color: #e11d48;">+${percentChange.toFixed(1)}% vs last week</span>`;
  } else {
    changeBadgeHtml = `<span style="display:inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #d1fae5; color: #059669;">-${percentChange.toFixed(1)}% vs last week</span>`;
  }

  // Top Category Section
  let topCategoryHtml = '';
  if (topCategory && topCategory.amount > 0) {
    const catColor = topCategory.color || '#8B5CF6';
    topCategoryHtml = `
      <div style="background-color: #fcfcfd; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 8px;">
          Highest Spend Category
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${catColor}; display: inline-block;"></div>
            <span style="font-size: 15px; font-weight: 700; color: #18181b;">${topCategory.name}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 15px; font-weight: 800; color: #18181b;">${currency}${topCategory.amount.toLocaleString()}</span>
            <span style="display: block; font-size: 11px; color: #71717a; font-weight: 600;">${topCategory.percentage.toFixed(0)}% of total</span>
          </div>
        </div>
        <div style="width: 100%; height: 6px; background-color: #f4f4f5; border-radius: 9999px; margin-top: 12px; overflow: hidden;">
          <div style="width: ${Math.min(topCategory.percentage, 100)}%; height: 100%; background-color: ${catColor}; border-radius: 9999px;"></div>
        </div>
      </div>
    `;
  }

  // Top Expenses Section
  let topExpensesHtml = '';
  if (topExpenses && topExpenses.length > 0) {
    const listItems = topExpenses
      .map(
        (exp) => `
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #18181b;">
            ${exp.title}
            <span style="display: block; font-size: 11px; font-weight: 400; color: #a1a1aa;">${exp.date} ${exp.categoryName ? '• ' + exp.categoryName : ''}</span>
          </td>
          <td style="padding: 10px 0; text-align: right; font-size: 13px; font-weight: 800; color: #18181b;">
            ${currency}${exp.amount.toLocaleString()}
          </td>
        </tr>
      `
      )
      .join('');

    topExpensesHtml = `
      <div style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 10px;">
          Top Expenses This Week
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${listItems}
          </tbody>
        </table>
      </div>
    `;
  }

  // Monthly Budget Section (if applicable)
  let budgetHtml = '';
  if (monthlyBudget && monthlyBudget.limit > 0) {
    const isOver = monthlyBudget.percentage > 100;
    const barColor = isOver ? '#ef4444' : monthlyBudget.percentage > 85 ? '#f59e0b' : '#10b981';

    budgetHtml = `
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 16px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 12px; font-weight: 700; color: #71717a;">Monthly Budget Status</span>
          <span style="font-size: 12px; font-weight: 800; color: #18181b;">${currency}${monthlyBudget.spentThisMonth.toLocaleString()} / ${currency}${monthlyBudget.limit.toLocaleString()}</span>
        </div>
        <div style="width: 100%; height: 6px; background-color: #e4e4e7; border-radius: 9999px; overflow: hidden;">
          <div style="width: ${Math.min(monthlyBudget.percentage, 100)}%; height: 100%; background-color: ${barColor};"></div>
        </div>
        <span style="display: block; font-size: 10px; color: #71717a; margin-top: 6px; font-weight: 500;">
          ${monthlyBudget.percentage.toFixed(0)}% of monthly budget utilized
        </span>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Financial Review</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #18181b; padding: 28px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; background-color: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">
                      Sunday Digest
                    </span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                      Weekly Financial Review
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 500; color: #a1a1aa;">
                      ${weekRange}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; font-weight: 500; color: #52525b; line-height: 1.5;">
                Hi <strong>${userName}</strong>,<br>
                Here is your personal spending breakdown for the week ending today.
              </p>

              <!-- Metrics Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <!-- This Week Card -->
                  <td width="48%" style="background-color: #fcfcfd; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px; vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 4px;">
                      This Week's Total
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #18181b; margin-bottom: 8px;">
                      ${formattedThisWeek}
                    </div>
                    <div>
                      ${changeBadgeHtml}
                    </div>
                  </td>
                  <td width="4%"></td>
                  <!-- Today (Sunday) Card -->
                  <td width="48%" style="background-color: #fcfcfd; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px; vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 4px;">
                      Today's Spend (Sunday)
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #18181b; margin-bottom: 8px;">
                      ${formattedToday}
                    </div>
                    <div style="font-size: 11px; font-weight: 600; color: #71717a;">
                      Previous Week: ${formattedPrevWeek}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Top Category Card -->
              ${topCategoryHtml}

              <!-- Top Expenses Table -->
              ${topExpensesHtml}

              <!-- Monthly Budget Status -->
              ${budgetHtml}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 9999px; letter-spacing: 0.02em;">
                      Open Fintro Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: 500; color: #a1a1aa; line-height: 1.5;">
                This weekly review reminder was automatically generated for your personal account.<br>
                To adjust your email preferences, visit your account Settings in Fintro.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

