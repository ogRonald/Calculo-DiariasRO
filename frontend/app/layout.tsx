import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '../components/Sidebar';
import ClientProvider from '../components/ClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SICADI - Sistema de Cálculo de Diárias',
  description: 'Sistema de Cálculo de Diárias de Rondônia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ClientProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}