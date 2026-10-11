import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Assam Engineering College | Attendance System",
  description: "Smart Attendance and Biometric Verification Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[#070b14] text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
