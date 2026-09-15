import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KisanFlow — From farm supply to market demand",
  description: "KisanFlow connects farmers, FPOs, and buyers to create a transparent, efficient agricultural supply chain across India.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
