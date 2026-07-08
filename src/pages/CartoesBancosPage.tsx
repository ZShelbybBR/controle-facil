import { useState, useEffect, useMemo } from 'react';
import { useWallets } from '@/hooks/useWallets';
import { formatCurrency, cn } from '@/lib/utils';
import { WALLET_TYPES, WALLET_COLORS } from '@/lib/constants';
import type { Wallet } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Wallet as WalletIcon } from 'lucide-react';

function getDefaultIcon(type: string) {
  const found = WALLET_TYPES.find((wt) => wt.value === type);
  return found?.icon ?? '💳';
}

export function CartoesBancosPage() {
  const { wallets, loading, error, fetchWallets, createWallet, updateWallet, deleteWallet } = useWallets();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('checking');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(WALLET_COLORS[0]);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
    [wallets],
  );

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  function openCreate() {
    setEditingWallet(null);
    setName('');
    setType('checking');
    setBalance('');
    setColor(WALLET_COLORS[0]);
    setDialogOpen(true);
  }

  function openEdit(wallet: Wallet) {
    setEditingWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.balance?.toString() ?? '');
    setColor(wallet.color || WALLET_COLORS[0]);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type: type as Wallet['type'],
        balance: parseFloat(balance.replace(',', '.')) || 0,
        color,
        icon: getDefaultIcon(type),
        is_active: true,
      };
      if (editingWallet) {
        await updateWallet(editingWallet.id, payload);
      } else {
        await createWallet(payload);
      }
      setDialogOpen(false);
    } catch {
      // handled by hook
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteWallet(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // handled by hook
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cartões e Bancos</h1>
          <p className="text-muted-foreground">Gerencie suas contas, cartões e carteiras</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && wallets.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Total Balance Summary */}
      {wallets.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-0 shadow-lg shadow-indigo-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Saldo Total</p>
                  <p className={cn('text-2xl font-bold', totalBalance >= 0 ? 'text-white' : 'text-red-200')}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-indigo-100">{wallets.length} conta{wallets.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-indigo-200">
                  {wallets.filter((w) => w.balance >= 0).length} positiva{wallets.filter((w) => w.balance >= 0).length !== 1 ? 's' : ''} · {wallets.filter((w) => w.balance < 0).length} negativa{wallets.filter((w) => w.balance < 0).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && wallets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <WalletIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma conta cadastrada</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Adicione cartões, contas bancárias ou carteiras para organizar suas finanças.
            </p>
            <Button onClick={openCreate} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wallet grid */}
      {wallets.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWallet ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>

          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-all"
              style={{ backgroundColor: color + '22', border: `3px solid ${color}` }}
            >
              {getDefaultIcon(type)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-name">Nome</Label>
              <Input
                id="wallet-name"
                placeholder="Ex: Nubank, Itaú, Carteira..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WALLET_TYPES.map((wt) => (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => setType(wt.value)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all',
                      type === wt.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    <span>{wt.icon}</span>
                    <span>{wt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-balance">Saldo</Label>
              <Input
                id="wallet-balance"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-6 gap-2">
                {WALLET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-9 w-9 rounded-full transition-all hover:scale-110',
                      color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim() || saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingWallet ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Conta</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir <strong>&quot;{deleteTarget?.name}&quot;</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Wallet Card ─── */

function WalletCard({
  wallet,
  onEdit,
  onDelete,
}: {
  wallet: Wallet;
  onEdit: (w: Wallet) => void;
  onDelete: (w: Wallet) => void;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl shadow-sm"
              style={{
                backgroundColor: `${wallet.color}22`,
                border: `2px solid ${wallet.color}44`,
              }}
            >
              {wallet.icon || getDefaultIcon(wallet.type)}
            </div>
            <div>
              <p className="font-semibold text-sm">{wallet.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {WALLET_TYPES.find((wt) => wt.value === wallet.type)?.label ?? wallet.type}
              </p>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(wallet)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(wallet)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={cn('text-xl font-bold', wallet.balance >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatCurrency(wallet.balance)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
