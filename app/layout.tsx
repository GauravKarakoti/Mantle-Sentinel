import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata = {
  title: "Mantle Sentinel",
  description: "AI Risk & Strategy Co-Pilot on Mantle",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <Providers>
          <main className="mx-auto px-8 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

