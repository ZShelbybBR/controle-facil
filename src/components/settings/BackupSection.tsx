import { useState, useRef } from 'react';
import { exportBackup, importBackup, exportCSV } from '@/lib/backup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export function BackupSection() {
  const [exportLoading, setExportLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExportLoading(true);
    setMessage(null);
    try {
      await exportBackup();
      setMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao exportar backup',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setCsvLoading(true);
    setMessage(null);
    try {
      await exportCSV();
      setMessage({ type: 'success', text: 'CSV exportado com sucesso!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao exportar CSV',
      });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportDialogOpen(true);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = async () => {
    if (!selectedFile) return;
    setImportLoading(true);
    setMessage(null);
    try {
      const result = await importBackup(selectedFile);
      setMessage({
        type: 'success',
        text: `Importação concluída! ${result.categoriesImported} categorias e ${result.transactionsImported} transações importadas.`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao importar backup',
      });
    } finally {
      setImportLoading(false);
      setImportDialogOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup & Restauração
          </CardTitle>
          <CardDescription>
            Exporte seus dados para manter um backup seguro ou importe um backup anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status message */}
          {message && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
                message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                  : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Export section */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar Backup (JSON)
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={csvLoading}
              className="flex items-center gap-2"
            >
              {csvLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exportar Transações (CSV)
            </Button>
          </div>

          {/* Import section */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Restaure seus dados a partir de um arquivo de backup (.json) exportado pelo ControleFácil.
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="flex items-center gap-2"
            >
              {importLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Import confirmation dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
            <DialogDescription>
              Você está prestes a importar o backup{' '}
              <span className="font-medium text-foreground">{selectedFile?.name}</span>.
              <br /><br />
              As categorias serão reutilizadas caso já existam com o mesmo nome. Transações
              duplicadas (mesma data, valor, descrição e categoria) serão ignoradas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={importLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleImportConfirm} disabled={importLoading}>
              {importLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
