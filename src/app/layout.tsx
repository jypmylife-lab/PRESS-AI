import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PressCraft AI",
  description: "AI-powered PR management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full">
            <div className="p-4 border-b flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-semibold">PressCraft AI 워크스페이스</span>
            </div>
            <div className="p-8">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
