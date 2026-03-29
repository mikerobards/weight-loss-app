import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import AppNav from '@/components/AppNav';

export const metadata: Metadata = {
  title: 'WeightIQ — Body Composition Tracker',
  description: 'Personal weight loss and body fat tracking with trend analysis and insights',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ThemeRegistry>
          <AppNav>{children}</AppNav>
        </ThemeRegistry>
      </body>
    </html>
  );
}
