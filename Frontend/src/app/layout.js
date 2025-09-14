// src/app/layout.js

import "./globals.css";
import { AuthProvider } from "@/context/authContext"
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next"
export const metadata = {
  title: "MyPhotoCapsule",
  description: "Photo Capsule is a simple and secure way to store and share your memories online. Create digital time capsules, organize your photos, and revisit them anytime."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
