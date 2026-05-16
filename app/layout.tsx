import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Suspense } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import "./globals.css";

config.autoAddCss = false;

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Pool Villa Pattaya",
  description: "ค้นหาและเปรียบเทียบบ้านพักพูลวิลล่า",
};

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-ibm-plex-sans-thai",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${ibmPlexSansThai.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense
            fallback={
              <div className="h-16 border-b border-border bg-background" />
            }
          >
            <SiteNavbar />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

