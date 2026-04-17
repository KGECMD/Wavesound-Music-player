import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AudioPlayerProvider } from '@/components/audio-player-provider'
import { AudioPlayer } from '@/components/audio-player'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: 'Wavesound — Lossless Music Discovery',
  description:
    'Stream Hi-Res lossless music, explore albums and discover artists with Wavesound, powered by Monochrome and DAB.',
  generator: 'Wavesound',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AudioPlayerProvider>
          {children}
          <AudioPlayer />
        </AudioPlayerProvider>
        <Analytics />
      </body>
    </html>
  )
}
