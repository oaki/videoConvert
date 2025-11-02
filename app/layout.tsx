import type { ReactNode } from 'react';

export const metadata = {
  title: 'Video Convert',
  description: 'Local video converter',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 20 }}>{children}</body>
    </html>
  );
}



