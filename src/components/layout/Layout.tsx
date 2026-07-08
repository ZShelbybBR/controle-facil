import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { InstallBanner } from '@/components/InstallBanner';

export function Layout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Header */}
        <Header />

        {/* Main content */}
        <main className="md:ml-64 p-4 md:p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* PWA Install Banner (mobile only) */}
        <InstallBanner />
      </div>
    </TooltipProvider>
  );
}
