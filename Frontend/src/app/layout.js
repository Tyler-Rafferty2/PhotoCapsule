// src/app/layout.js

import "./globals.css";
import { AuthProvider } from "@/context/authContext"
import { Suspense } from "react";
export const metadata = {
  title: "PhotoVault",
  description: "Image sharing app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
