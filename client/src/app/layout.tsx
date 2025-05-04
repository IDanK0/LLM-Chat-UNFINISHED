// This might be a different file in your project (App.tsx or layout.tsx)
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@/components/QueryClientProvider";
import { MobileOptimization } from "@/components/MobileOptimization";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat AI",
  description: "A modern AI chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={cn("bg-background antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryClientProvider>
            <MobileOptimization />
            {children}
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}