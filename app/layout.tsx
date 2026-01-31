import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stewie AI Terminal',
  description: 'Intelligent Kubernetes infrastructure assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>{children}</body>
    </html>
  )
}
