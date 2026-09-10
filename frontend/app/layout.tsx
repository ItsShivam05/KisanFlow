import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KisanFlow | Farm to market, simplified",
  description: "AI-powered farm-to-market supply network."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
