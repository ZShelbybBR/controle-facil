import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Transaction, CategoryBreakdown } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Brand accent bar
  doc.setFillColor(99, 102, 241); // #6366F1
  doc.rect(0, 0, 210, 6, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241);
  doc.text(title, 20, 22);

  // Subtitle / date range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 20, 30);

  // Generated date
  doc.setFontSize(8);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 20, 36);

  return 42; // Y offset after header
}

function addSummaryTable(
  doc: jsPDF,
  startY: number,
  rows: Array<[string, string]>,
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Resumo', 20, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Métrica', 'Valor']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 20, right: 20 },
    styles: { cellPadding: 3 },
  });

  return (doc as any).lastAutoTable.finalY + 8;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ══════════════════════════════════════════════════════════════════════════════
export interface PDFExportOptions {
  transactions: Transaction[];
  periodLabel: string;
  tab: 'weekly' | 'monthly' | 'annual';
  stats: { totalIncome: number; totalExpense: number; balance: number };
  categoryBreakdown?: CategoryBreakdown[];
}

export function exportToPDF(options: PDFExportOptions) {
  const { transactions, periodLabel, tab, stats, categoryBreakdown } = options;
  const doc = new jsPDF();

  // ── Header ────────────────────────────────────────────────────────────────
  const tabLabels: Record<string, string> = {
    weekly: 'Relatório Semanal',
    monthly: 'Relatório Mensal',
    annual: 'Relatório Anual',
  };
  let y = addHeader(doc, 'ControleFácil', `${tabLabels[tab]} — ${periodLabel}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  y = addSummaryTable(doc, y, [
    ['Total Receitas', formatBRL(stats.totalIncome)],
    ['Total Despesas', formatBRL(stats.totalExpense)],
    ['Saldo', formatBRL(stats.balance)],
  ]);

  // ── Category Breakdown (monthly tab) ──────────────────────────────────────
  if (tab === 'monthly' && categoryBreakdown && categoryBreakdown.length > 0) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Gastos por Categoria', 20, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['Categoria', 'Total', 'Percentual']],
      body: categoryBreakdown.map((c) => [
        `${c.category_icon} ${c.category_name}`,
        formatBRL(c.total),
        `${c.percentage.toFixed(1)}%`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 3 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Transaction List ──────────────────────────────────────────────────────
  if (transactions.length > 0) {
    // Check if we need a new page
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Lista de Transações', 20, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: transactions.map((t) => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
        t.category?.name ?? 'Sem categoria',
        t.type === 'income' ? 'Receita' : 'Despesa',
        formatBRL(t.amount),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 2 },
      didParseCell: (data) => {
        // Color-code the "Tipo" column (index 3)
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.raw as string;
          if (val === 'Receita') {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (val === 'Despesa') {
            data.cell.styles.textColor = [239, 68, 68];
          }
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.cellWidth = 18;
        }
      },
    });
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ControleFácil • Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `controle-facil-${tab}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(filename);
}
