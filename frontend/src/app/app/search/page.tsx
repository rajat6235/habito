import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Search' };
export default function SearchPage() {
  return <div className="p-4 md:p-6"><h1 className="text-2xl font-bold mb-6">Search</h1></div>;
}
