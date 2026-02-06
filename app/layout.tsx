import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMS Dashboard — Association Management",
  description:
    "Admin dashboard for managing SMS communications across luxury transportation associations",
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
