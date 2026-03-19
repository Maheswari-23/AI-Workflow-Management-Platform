import './globals.css'

export const metadata = {
  title: 'AI Workflow Platform',
  description: 'Manage AI agents and workflows',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
