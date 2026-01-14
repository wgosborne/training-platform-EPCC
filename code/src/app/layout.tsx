import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Running Trainer MVP',
  description: 'A running training plan microservice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
