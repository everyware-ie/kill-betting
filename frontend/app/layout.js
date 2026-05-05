import './globals.css';
import Providers from './providers';
import Navbar from '@/components/layout/Navbar';

export const metadata = {
  title: 'Kill Challenge',
  description: '배틀그라운드 킬내기 관리 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Share+Tech+Mono&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
