import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forms Platform | منصة النماذج",
  description: "Bilingual forms platform on Cloudflare Workers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
