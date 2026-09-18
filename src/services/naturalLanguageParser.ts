import dayjs from 'dayjs';

export interface ParsedTransactionDraft {
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'BORROW' | 'LEND' | 'REPAYMENT' | 'EMI_PAYMENT';
  amount: number;
  description: string;
  merchant?: string;
  suggestedAccountName?: string;
  suggestedCategoryName?: string;
  date: string;
}

/**
 * Natural Language Transaction Entry Parser Engine
 * Converts natural text input into structured draft transactions.
 */
export const parseNaturalLanguageInput = (input: string): ParsedTransactionDraft => {
  const text = input.trim();
  const lower = text.toLowerCase();

  let type: ParsedTransactionDraft['type'] = 'EXPENSE';
  let amount = 0;
  let description = text;
  let merchant = '';
  let suggestedAccountName = '';
  let suggestedCategoryName = '';
  const date = dayjs().format('YYYY-MM-DD');

  // Extract Amount (matches ₹ or Rs or numbers e.g. 450, 450.50, 7000)
  const amountMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }

  // Detect Type
  if (lower.includes('salary') || lower.includes('received') || lower.includes('income') || lower.includes('got paid')) {
    type = 'INCOME';
    suggestedCategoryName = 'Salary';
  } else if (lower.includes('lent') || lower.includes('gave to')) {
    type = 'LEND';
  } else if (lower.includes('borrowed') || lower.includes('took from')) {
    type = 'BORROW';
  } else if (lower.includes('emi') || lower.includes('loan payment')) {
    type = 'EMI_PAYMENT';
  } else if (lower.includes('transfer') || lower.includes('sent to bank')) {
    type = 'TRANSFER';
  } else if (lower.includes('repaid') || lower.includes('paid back')) {
    type = 'REPAYMENT';
  }

  // Detect Account mentions
  if (lower.includes('hdfc')) suggestedAccountName = 'HDFC';
  else if (lower.includes('sbi')) suggestedAccountName = 'SBI';
  else if (lower.includes('icici')) suggestedAccountName = 'ICICI';
  else if (lower.includes('cash')) suggestedAccountName = 'Cash';
  else if (lower.includes('upi')) suggestedAccountName = 'UPI';

  // Detect Category / Merchant mentions
  if (lower.includes('dinner') || lower.includes('lunch') || lower.includes('food') || lower.includes('restaurant')) {
    suggestedCategoryName = 'Food';
  } else if (lower.includes('rent')) {
    suggestedCategoryName = 'Housing';
    merchant = 'Landlord';
  } else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('cab') || lower.includes('uber')) {
    suggestedCategoryName = 'Travel';
  } else if (lower.includes('groceries') || lower.includes('swiggy') || lower.includes('zepto') || lower.includes('zomato')) {
    suggestedCategoryName = 'Grocery';
  }

  // Extract merchant after "at" or "from" or "for"
  const atMatch = text.match(/(?:at|from|to)\s+([A-Za-z0-9\s]+?)(?:\s+using|\s+with|\s+date|$)/i);
  if (atMatch) {
    merchant = atMatch[1].trim();
  }

  return {
    type,
    amount,
    description: description || `${type} transaction`,
    merchant: merchant || undefined,
    suggestedAccountName: suggestedAccountName || undefined,
    suggestedCategoryName: suggestedCategoryName || undefined,
    date,
  };
};
