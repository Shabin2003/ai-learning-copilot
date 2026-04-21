import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'LearnOS — AI Learning Copilot',
  description: 'Adaptive AI tutoring that learns how you learn.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              borderRadius: '12px',
              border: '1px solid rgba(13,13,15,0.08)',
            },
          }}
        />
      </body>
    </html>
  )
}
