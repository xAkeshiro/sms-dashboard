import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAS International — SMS Tool",
  description:
    "RAS International SMS tool for managing communications across luxury transportation associations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
