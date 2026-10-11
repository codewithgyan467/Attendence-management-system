import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Admin Portal | Attendance Platform",
  description: "Administrative dashboard for the Attendance Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased flex h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
