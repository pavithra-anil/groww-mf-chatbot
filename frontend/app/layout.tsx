import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Groww MF FAQ Assistant",
  description: "Facts-only mutual fund FAQ chatbot for HDFC schemes on Groww",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}