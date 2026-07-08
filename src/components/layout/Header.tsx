import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from './SidebarMobileContent';

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-30 shadow-sm shadow-black/5">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false}>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-bold text-lg">ControleFácil</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className="text-foreground hover:bg-accent hover:text-accent-foreground" />
        <Avatar size="sm">
          <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
          <AvatarFallback className="bg-indigo-600 text-white text-xs">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
