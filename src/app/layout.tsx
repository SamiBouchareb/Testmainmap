import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { MindMapProvider } from '@/contexts/MindMapContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Mind Map',
  description: 'Generate and manage interactive mind maps through AI-generated content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MindMapProvider>
            {children}
          </MindMapProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
