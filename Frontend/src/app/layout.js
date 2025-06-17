// src/app/layout.js
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

