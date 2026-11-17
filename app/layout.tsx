import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV Intelligence — Understand your data instantly",
  description:
    "Upload a CSV and get instant, private, in-browser analysis: statistics, data quality, visualizations and cleaning tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-zinc-200 antialiased">
        {children}
      </body>
    </html>
  );
}
