import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SSFI - Skating Sports Federation of India",
  description:
    "Official digital platform of the Skating Sports Federation of India. Register for events, manage memberships, and access skating resources.",
  keywords: [
    "skating",
    "SSFI",
    "India",
    "skating federation",
    "roller skating",
    "ice skating",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${openSans.variable} antialiased font-sans`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
