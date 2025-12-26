import type { Metadata } from 'next';
import './globals.css';
import VersionCheck from '@/components/VersionCheck';
import WebVitalsReporter from '@/components/WebVitalsReporter';

export const metadata: Metadata = {
  title: 'OpsSure | Enterprise Incident Management',
  description: 'PagerDuty Clone',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VersionCheck />
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}

