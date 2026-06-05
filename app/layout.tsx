import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Shipra's AI Representative",
  description: 'Talk to Shipra\'s AI persona — ask about her background, projects, and book an interview.',
  openGraph: {
    title: "Shipra Kumari — AI Representative",
    description: 'Healthcare AI researcher. BITS Pilani. BrainSightAI intern. Ask me anything.',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
