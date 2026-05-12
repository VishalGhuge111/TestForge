import Script from 'next/script';

export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        console.error('Theme init error:', e);
      }
    })();
  `;

  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {themeScript}
    </Script>
  );
}
