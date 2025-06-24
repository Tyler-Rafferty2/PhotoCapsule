// src/app/layout.js
import './globals.css'
export const metadata = {
  title: 'PhotoVault',
  description: 'Image sharing app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

