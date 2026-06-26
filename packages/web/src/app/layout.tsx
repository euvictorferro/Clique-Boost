import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextPanel } from "@/components/layout/ContextPanel";
import { ToastProvider } from "@/components/shared/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clique Boost — Social Media",
  description: "Dashboard de gestão de social media",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <ContextPanel />
          <main className="flex-1 overflow-y-auto bg-[#f5f5f5]">
            <ToastProvider>{children}</ToastProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
