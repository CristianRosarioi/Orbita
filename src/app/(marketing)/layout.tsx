import type { ReactNode } from 'react';
import { Navbar } from './_components/navbar';
import { Footer } from './_components/footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
