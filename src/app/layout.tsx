import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebBuilder - Build Stunning Websites with AI',
  description: 'A powerful WYSIWYG website builder with AI assistance, one-click deployment, and version history.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 11%)',
              color: 'hsl(0 0% 95%)',
              border: '1px solid hsl(0 0% 18%)',
            },
          }}
        />
      </body>
    </html>
  );
}
