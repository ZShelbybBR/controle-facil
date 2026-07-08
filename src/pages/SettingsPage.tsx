import { useAuth } from '@/hooks/useAuth';
import { BackupSection } from '@/components/settings/BackupSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Info } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua conta e dados do aplicativo.
        </p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Conta
          </CardTitle>
          <CardDescription>Informações da sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup section */}
      <BackupSection />

      {/* About section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Aplicativo</span>
            <span className="text-sm font-medium">ControleFácil</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Versão</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stack</span>
            <span className="text-sm font-medium">React + Supabase</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
