import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/app-context';
import { TimerProvider } from '@/context/timer-context';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'FocusFlow',
  description: 'A timer app for work and breaks with task tracking and analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Self-hosted fonts - no external requests */}
      </head>
      <body className="font-body antialiased">
        <Providers>
          <AppProvider>
            <TimerProvider>
              <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                  {children}
                </main>
              </div>
              <Toaster />
            </TimerProvider>
          </AppProvider>
        </Providers>
      </body>
    </html>
  );
}
