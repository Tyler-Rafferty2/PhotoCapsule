// src/app/layout.js
import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "MyPhotoCapsule",
  description:
    "Photo Capsule is a simple and secure way to store and share your memories online. Create digital time capsules, organize your photos, and revisit them anytime.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        {/* Optional: different sizes for Google */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
            <Analytics />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
