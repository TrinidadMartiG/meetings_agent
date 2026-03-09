import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"

export const metadata: Metadata = {
  title: {
    default: "KAM Meeting Assistant",
    template: "%s | KAM Meeting Assistant",
  },
  description:
    "Asistente inteligente para reuniones de Key Account Managers. Extrae insights, gestiona tareas y construye una base de conocimiento de clientes.",
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
