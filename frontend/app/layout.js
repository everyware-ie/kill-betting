import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Killnagi',
  description: '배틀그라운드 킬내기 관리 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kn-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`,
          }}
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}