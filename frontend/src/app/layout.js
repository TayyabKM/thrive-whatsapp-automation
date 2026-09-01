import './globals.css';

export const metadata = {
  title: 'Thrive WhatsApp Dashboard',
  description: 'WhatsApp message monitoring and analytics — by MMT Consulting',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
