import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
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
  description:
    "MoodMap is a free real-time global mood tracker. Share how your day was (good or bad) anonymously and visualize world sentiment.",
  keywords:
    "mood tracker, daily mood check-in, global sentiment analysis, how are you feeling, anonymous mood sharing, sentiment tracker, daily wellness",
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
  alternates: {
    canonical: "https://moodmap-eight.vercel.app",
  },
  verification: {
    // replace with actual code after you add to GSC

    google: "r1y8hjqObCy7zAr_dNzdzu1My1yPpVY04WtAlJEzHxg",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "MoodMap",
        "url": "https://moodmap-eight.vercel.app",
        "alternateName": ["MoodMap Real-Time", "MoodMap Tracker"]
      },
      {
        "@type": "WebApplication",
        "name": "MoodMap",
        "description": "Global real-time mood tracker",
        "url": "https://moodmap-eight.vercel.app",
        "applicationCategory": "UtilityApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        }
      }
    ]
  };

  return (
    <>
      <html lang="en">
        <head>
          <meta name="theme-color" content="#0f172a" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
      <SpeedInsights />
    </>
  );
}