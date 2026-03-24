import GlobalSidebar from '../components/GlobalSidebar';
import { ToastProvider } from '../components/Toast';
import './globals.css';

export const metadata = {
  title: 'AI Workflow Platform',
  description: 'Manage AI agents and workflows',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden">
        <ToastProvider />
        <GlobalSidebar />
        <main className="flex-1 ml-64 h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
