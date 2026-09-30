import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toyamas Cloud — Simple deployment. Your infrastructure.",
  description:
    "Lightweight self-hosted Platform-as-a-Service for deploying and managing web applications on a single Ubuntu VPS.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#fafafa] antialiased selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
