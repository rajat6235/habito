import type { Metadata } from 'next';
import { ExpensesView } from '@/components/features/expenses/ExpensesView';

export const metadata: Metadata = { title: 'Expenses' };

export default function ExpensesPage() {
  return <ExpensesView />;
}
