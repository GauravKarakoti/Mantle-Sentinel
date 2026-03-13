import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Mantle Sentinel",
  description: "AI Risk & Strategy Co-Pilot on Mantle"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

