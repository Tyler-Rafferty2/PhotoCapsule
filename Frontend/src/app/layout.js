// src/app/layout.js
import "./globals.css";
import { AuthProvider } from "@/context/authContext"
export const metadata = {
  title: "PhotoVault",
  description: "Image sharing app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
