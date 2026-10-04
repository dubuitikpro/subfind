import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubFind — Tìm phụ đề nhanh",
  description: "Tìm phụ đề hợp pháp từ các nhà cung cấp bạn chọn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
