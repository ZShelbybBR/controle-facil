import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import type { Category } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Loader2, Plus } from 'lucide-react';

const EMOJI_OPTIONS = [
  '🍔', '🚗', '🏠', '💊', '📚', '🎮', '💰', '💻', '📌', '🛒',
  '🎬', '✈️', '🏋️', '🐕', '🎵', '💡', '🔧', '📱', '🐱', '🎨',
  '📈', '💳', '🎁', '☕', '🏥', '👶', '🧹', '🌍', '💼', '🎓',
];

const COLOR_OPTIONS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444',
  '#eab308', '#f97316', '#06b6d4', '#10b981',
  '#6366f1', '#6b7280', '#ec4899', '#14b8a6',
];

const DEFAULT_CATEGORY_NAMES: Set<string> = new Set(DEFAULT_CATEGORIES.map((c) => c.name));

function isDefaultCategory(name: string) {
  return DEFAULT_CATEGORY_NAMES.has(name);
}

export function CategoriesPage() {
  const { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#6b7280');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openCreate() {
    setEditingCategory(null);
    setName('');
    setIcon('📌');
    setColor('#6b7280');
    setType('expense');
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setType(cat.type);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: name.trim(), icon, color, type });
      } else {
        await createCategory({ user_id: '', name: name.trim(), icon, color, type });
      }
      setDialogOpen(false);
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize suas transações por categorias</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && categories.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Despesas */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-red-600">💸 Despesas</h2>
        {expenseCategories.length === 0 && !loading ? (
          <p className="text-muted-foreground text-sm py-4">Nenhuma categoria de despesa criada.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {expenseCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </section>

      {/* Receitas */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-green-600">💰 Receitas</h2>
        {incomeCategories.length === 0 && !loading ? (
          <p className="text-muted-foreground text-sm py-4">Nenhuma categoria de receita criada.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {incomeCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </section>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-all"
                style={{ backgroundColor: color + '22', border: `3px solid ${color}` }}
              >
                {icon}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Alimentação"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === 'expense' ? 'default' : 'outline'}
                  onClick={() => setType('expense')}
                  className={type === 'expense' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  💸 Despesa
                </Button>
                <Button
                  type="button"
                  variant={type === 'income' ? 'default' : 'outline'}
                  onClick={() => setType('income')}
                  className={type === 'income' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  💰 Receita
                </Button>
              </div>
            </div>

            {/* Emoji Picker */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-muted transition-colors ${
                      icon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-9 h-9 rounded-full transition-all hover:scale-110 ${
                      color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
            {deleteTarget && isDefaultCategory(deleteTarget.name) && (
              <span className="block mt-1 text-amber-600 text-sm">
                ⚠️ Esta é uma categoria padrão. Será recriada na próxima vez.
              </span>
            )}
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

/* ─── Category Card ─── */

function CategoryCard({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const isDefault = isDefaultCategory(cat.name);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: cat.color + '22', border: `2px solid ${cat.color}44` }}
            >
              {cat.icon}
            </div>
            <div>
              <p className="font-semibold text-sm">{cat.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {cat.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              </div>
              {isDefault && (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  Padrão
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(cat)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {!isDefault && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(cat)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
