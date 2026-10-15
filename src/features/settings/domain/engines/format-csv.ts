export interface CsvColumn {
  key: string;
  label: string;
}

/**
 * Formata um conjunto de registros em string CSV com UTF-8 BOM, delimitador ';'
 * e escape RFC 4180 de aspas duplas, totalmente compatível com Microsoft Excel (pt-BR).
 */
export function formatCsvContent<T extends Record<string, any>>(
  rows: T[],
  columns: CsvColumn[]
): string {
  const BOM = '\uFEFF';

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) {
      return '';
    }
    const str = String(val);
    const mustQuote = str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r');
    if (mustQuote) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map(c => escapeCell(c.label)).join(';');
  const dataLines = rows.map(row => {
    return columns.map(col => escapeCell(row[col.key] ?? '')).join(';');
  });

  const fullContent = [headerLine, ...dataLines].join('\r\n');
  return BOM + fullContent;
}
