import { useState, useEffect } from 'react';
import { Target, PartyPopper, Pencil, Check } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GOAL_STORAGE_KEY = 'controle-facil-monthly-goal';

export function MonthlyGoalCard() {
  const { monthlyStats } = useDashboard();
  const [goal, setGoal] = useState<number>(() => {
    const saved = localStorage.getItem(GOAL_STORAGE_KEY);
    return saved ? parseFloat(saved) : 0;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Persist goal to localStorage
  useEffect(() => {
    if (goal > 0) {
      localStorage.setItem(GOAL_STORAGE_KEY, goal.toString());
    }
  }, [goal]);

  const savings = monthlyStats.balance;
  const progress = goal > 0 ? Math.min((savings / goal) * 100, 100) : 0;
  const isGoalMet = savings >= goal && goal > 0;

  const handleSave = () => {
    const parsed = parseFloat(inputValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(parsed);
    }
    setIsEditing(false);
  };

  const startEditing = () => {
    setInputValue(goal > 0 ? goal.toString() : '');
    setIsEditing(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          Meta Mensal
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={startEditing}
          className="h-8 px-2"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Goal editing */}
        {isEditing ? (
          <div className="flex items-center gap-2 mb-4">
            <Input
              type="number"
              placeholder="Digite a meta (R$)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>
        ) : goal > 0 ? (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Meta</span>
              <span className="font-bold text-lg text-indigo-600">
                {formatCurrency(goal)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm mb-4">
            <p>Defina uma meta de economia mensal</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              className="mt-2"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Definir Meta
            </Button>
          </div>
        )}

        {/* Progress */}
        {goal > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Economia atual</span>
                <span className={`font-semibold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(savings)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGoalMet
                      ? 'bg-green-500'
                      : progress >= 70
                      ? 'bg-indigo-500'
                      : progress >= 40
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% concluído</span>
                <span>{formatCurrency(savings)} de {formatCurrency(goal)}</span>
              </div>
            </div>

            {/* Celebration */}
            {isGoalMet && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <PartyPopper className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      🎉 Parabéns!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Você atingiu sua meta de economia mensal!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining */}
            {!isGoalMet && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Faltam</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCurrency(Math.max(goal - savings, 0))}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
