import './globals.css';

export const metadata = {
  title: 'SARRAF ERDEM - Akıllı Vitrin & Mücevherat ERP',
  description: 'Hassas ağırlık sensörlü vitrin askı takip, hırsızlık alarmı, canlı altın kur ekranı ve kuyumcu ERP sistemi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0b0c10] text-slate-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
