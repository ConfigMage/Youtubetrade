import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import { CurrentMemberProvider } from "@/components/layout/CurrentMemberContext";

export const metadata: Metadata = {
  title: "Video Trade",
  description: "Trade YouTube videos with your family",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CurrentMemberProvider>
          <Header />
          {children}
        </CurrentMemberProvider>
      </body>
    </html>
  );
}
