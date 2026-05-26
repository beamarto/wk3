import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TailwindSafelist from "@/app/components/TailwindSafelist";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Business Card Directory",
  description: "Week 3 directory powered by Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TailwindSafelist />
        {children}
      </body>
    </html>
  );
}
