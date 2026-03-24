import GlobalSidebar from '../components/GlobalSidebar';
import './globals.css';

export const metadata = {
  title: 'AI Workflow Platform',
  description: 'Manage AI agents and workflows',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex">
        <GlobalSidebar />
        <main className="flex-1 ml-64 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
