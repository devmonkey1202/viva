import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";

import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-viva-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "VIVA",
  description:
    "제출 이후 학생의 실제 이해를 검증하는 교육 평가 레이어, VIVA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  );
}
