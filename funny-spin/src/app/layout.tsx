import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🎡 룰렛",
  description: "재미있는 룰렛 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
