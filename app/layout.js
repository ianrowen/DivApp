import './globals.css';

export const metadata = {
  title: 'RWS Tarot Reader',
  description: 'Experimental Rider-Waite-Smith Tarot card reader with AI interpretations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}