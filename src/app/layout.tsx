import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { FloatingChat } from "@/components/FloatingChat";
import { GlobalAlert } from "@/components/GlobalAlert";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartNote AI",
  description: "Study smarter with AI-powered notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground bg-background grid-background`}
        suppressHydrationWarning
      >
        <SessionProvider>
            <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            >
            <LanguageProvider>
              <TooltipProvider>
                {children}
                <FloatingChat />
                <GlobalAlert />
                <Toaster />
              </TooltipProvider>
            </LanguageProvider>
            </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
