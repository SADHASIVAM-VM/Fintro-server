import { Response } from 'express';
import { Expense } from '../models/Expense';
import { AuthenticatedRequest } from '../middleware/auth';

// Export expenses to CSV format
export const exportExpensesCSV = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const userId = req.user.id;

  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: userId };
    const expenses = await Expense.find(query).populate('category', 'name');

    let csv = 'ID,Title,Amount,Category,Payment Mode,Date,Time,Notes,Tags\n';
    
    expenses.forEach((e: any) => {
      const tagsStr = e.tags ? e.tags.join(';') : '';
      const catName = e.category ? e.category.name : 'Unassigned';
      const safeTitle = (e.title || '').replace(/"/g, '""');
      const safeNotes = (e.notes || '').replace(/"/g, '""');
      
      csv += `"${e._id}","${safeTitle}",${e.amount},"${catName}","${e.paymentMode}","${e.date}","${e.time || ''}","${safeNotes}","${tagsStr}"\n`;
    });

    res.setHeader('Content-disposition', 'attachment; filename=expenses-report.csv');
    res.setHeader('Content-type', 'text/csv');
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error compiling CSV report' });
  }
};
export default exportExpensesCSV;
