import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-viva-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const serif = Noto_Serif_KR({
  variable: "--font-viva-serif",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "VIVA",
  description:
    "AI 시대에도 학생의 진짜 이해를 제출 이후 검증으로 드러내는 VIVA 교육 검증 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
