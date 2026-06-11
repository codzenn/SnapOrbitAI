import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SnapOrbitAI",
  description:
    "Prepare images and videos with AI background removal, generative fill, captions, audits, search, and batch workflows.",
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
      <body
        className="min-h-full bg-base-200 text-base-content"
        suppressHydrationWarning
      >
        <ClerkProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
