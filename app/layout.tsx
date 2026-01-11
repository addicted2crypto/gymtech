import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'TechForGyms - Complete Gym Management Platform',
  description: 'The all-in-one platform for gym owners. Manage members, classes, payments, and grow your business.',
  keywords: ['gym management', 'fitness software', 'membership management', 'class scheduling', 'Kickboxing', 'MMA', 'Muay Thai', 'Jiu Jitsu', 'personal training', 'payment processing', 'Stripe integration', 'gym software', 'fitness center management'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
