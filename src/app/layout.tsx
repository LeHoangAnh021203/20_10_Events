import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam, Pinyon_Script } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const pinyonScript = Pinyon_Script({
  variable: "--font-pinyon-script",
  subsets: ["latin"],
  weight: ["400"],
});

const bonheurRoyale = localFont({
  variable: "--font-bonheur-royale",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/BonheurRoyale-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
});

const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Thin.ttf", weight: "100", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../SVN-Poppins (18 fonts)/TTF/SVN-Poppins-Black.ttf", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "FBNetwork's events",
  description: "Đón Sinh Nhật Cùng Cáo!!!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2T5HK6RP11"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2T5HK6RP11');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} ${pinyonScript.variable} ${bonheurRoyale.variable} ${poppins.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
