import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORCA FINANCIAL | Intelligent Investment Dashboard",
  description: "Dashboard tài chính thông minh: thị trường Việt Nam, thế giới, hàng hóa, chiến lược đầu tư, search và snapshot dữ liệu tự động mỗi 1 giờ.",
  keywords: ["VNINDEX", "VN30", "chứng khoán", "đầu tư", "hàng hóa", "phân tích kỹ thuật", "dashboard tài chính"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
