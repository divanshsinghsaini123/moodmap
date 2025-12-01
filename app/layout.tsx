import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoodMap - Real-Time Global Mood Tracker | Share Your Daily Feeling",
  description: "MoodMap is a free real-time global mood tracker. Share how your day was (good or bad) anonymously and visualize world sentiment. Join thousands tracking global moods daily.",
  keywords: "mood tracker, daily mood check-in, global sentiment analysis, how are you feeling, anonymous mood sharing, sentiment tracker, daily wellness",
  authors: [{ name: "MoodMap Team" }],
  creator: "MoodMap",
  publisher: "MoodMap",
  openGraph: {
    title: "MoodMap - Global Mood Tracker",
    description: "Real-time mood tracking. Share anonymously, see global sentiment instantly.",
    url: "https://moodmap-eight.vercel.app",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://moodmap-eight.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "MoodMap Global Mood Tracker Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoodMap - How's the world feeling?",
    description: "Anonymous global mood tracker. Share your mood instantly.",
    images: ["https://moodmap-eight.vercel.app/og-image.png"],
  },
  // ...existing code...
robots: {
    index: true,
    follow: true,
    nocache: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
// ...existing code...
  alternates: {
    canonical: "https://moodmap-eight.vercel.app",
  },
  verification: {
    google: "your-google-search-console-code", // Add your GSC verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MoodMap",
    description: "Global real-time mood tracker",
    url: "https://moodmap-eight.vercel.app",
    applicationCategory: "UtilityApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="canonical" href="https://moodmap-eight.vercel.app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}