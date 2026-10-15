import { formatCsvContent } from '../engines/format-csv';

describe('formatCsvContent', () => {
  it('should format rows with UTF-8 BOM and semicolon separator', () => {
    const columns = [
      { key: 'ear_tag', label: 'BRINCO' },
      { key: 'name', label: 'NOME' },
      { key: 'status', label: 'STATUS' },
    ];
    const rows = [
      { ear_tag: '101', name: 'Estrela', status: 'Prenhe' },
      { ear_tag: '102', name: 'Mimosa', status: 'Vazia' },
    ];

    const result = formatCsvContent(rows, columns);

    // Starts with UTF-8 BOM
    expect(result.charCodeAt(0)).toBe(0xFEFF);

    const contentWithoutBOM = result.slice(1);
    const lines = contentWithoutBOM.split('\r\n');

    expect(lines[0]).toBe('BRINCO;NOME;STATUS');
    expect(lines[1]).toBe('101;Estrela;Prenhe');
    expect(lines[2]).toBe('102;Mimosa;Vazia');
  });

  it('should escape double quotes and fields containing semicolon', () => {
    const columns = [
      { key: 'ear_tag', label: 'BRINCO' },
      { key: 'notes', label: 'OBSERVAÇÕES' },
    ];
    const rows = [
      { ear_tag: '103', notes: 'Observação; com ponto e vírgula' },
      { ear_tag: '104', notes: 'Vaca "Especial"' },
    ];

    const result = formatCsvContent(rows, columns);
    const lines = result.slice(1).split('\r\n');

    expect(lines[1]).toBe('103;"Observação; com ponto e vírgula"');
    expect(lines[2]).toBe('104;"Vaca ""Especial"""');
  });

  it('should handle empty rows and missing fields gracefully', () => {
    const columns = [
      { key: 'ear_tag', label: 'BRINCO' },
      { key: 'notes', label: 'OBS' },
    ];
    const rows: Record<string, string>[] = [];

    const result = formatCsvContent(rows, columns);
    const lines = result.slice(1).split('\r\n');

    expect(lines[0]).toBe('BRINCO;OBS');
    expect(lines.length).toBe(1);
  });
});
