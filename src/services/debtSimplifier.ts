export interface NetBalance {
  userId: string;
  userName?: string;
  netAmount: number; // positive = should receive, negative = owes
}

export interface SimplifiedSettlement {
  fromUser: string;
  fromUserName?: string;
  toUser: string;
  toUserName?: string;
  amount: number;
}

/**
 * Debt Simplification Minimization Graph Algorithm
 * Reduces N-way roommate debt matrix into minimum required direct payments.
 * Time Complexity: O(N log N)
 */
export const simplifyDebts = (balances: NetBalance[]): SimplifiedSettlement[] => {
  const debtors: { userId: string; userName?: string; amount: number }[] = [];
  const creditors: { userId: string; userName?: string; amount: number }[] = [];

  // Separate debtors and creditors
  for (const b of balances) {
    const rounded = Math.round(b.netAmount * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ userId: b.userId, userName: b.userName, amount: Math.abs(rounded) });
    } else if (rounded > 0.01) {
      creditors.push({ userId: b.userId, userName: b.userName, amount: rounded });
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: SimplifiedSettlement[] = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    settlements.push({
      fromUser: debtor.userId,
      fromUserName: debtor.userName,
      toUser: creditor.userId,
      toUserName: creditor.userName,
      amount: settledAmount,
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (Math.abs(debtor.amount) < 0.01) i++;
    if (Math.abs(creditor.amount) < 0.01) j++;
  }

  return settlements;
};
