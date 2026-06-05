import { describe, expect, it } from 'vitest';
import { createPdfTableBody, stringifyPdfCell } from '../lib/pdf-format';
import type { PdfTableData } from '../lib/types';

const data: PdfTableData = {
  headers: [
    ['Region', '', ''],
    ['Name', 'Age', 'Meta'],
  ],
  props: ['name', 'age', 'meta'],
  data: [
    { name: 'Alice', age: 31, meta: { active: true } },
    { name: 'Bob', age: null, meta: undefined },
  ],
};

describe('pdf format', () => {
  it('creates a pdfmake table body with group and column headers', () => {
    const body = createPdfTableBody(data);

    expect(body).toHaveLength(4);
    expect(body[0]).toEqual([
      { text: 'Region', style: 'tableHeader' },
      { text: '', style: 'tableHeader' },
      { text: '', style: 'tableHeader' },
    ]);
    expect(body[1]).toEqual([
      { text: 'Name', style: 'tableHeader' },
      { text: 'Age', style: 'tableHeader' },
      { text: 'Meta', style: 'tableHeader' },
    ]);
    expect(body[2]).toEqual(['Alice', '31', '{"active":true}']);
  });

  it('can omit group headers while keeping column headers', () => {
    const body = createPdfTableBody(data, { includeGroupHeaders: false });

    expect(body).toHaveLength(3);
    expect(body[0]).toEqual([
      { text: 'Name', style: 'tableHeader' },
      { text: 'Age', style: 'tableHeader' },
      { text: 'Meta', style: 'tableHeader' },
    ]);
  });

  it('can omit all headers', () => {
    const body = createPdfTableBody(data, { includeColumnHeaders: false });

    expect(body).toHaveLength(2);
    expect(body[0]).toEqual(['Alice', '31', '{"active":true}']);
  });

  it('limits data rows with maxRows', () => {
    const body = createPdfTableBody(data, { maxRows: 1 });

    expect(body).toHaveLength(3);
    expect(body[2]).toEqual(['Alice', '31', '{"active":true}']);
  });

  it('stringifies supported cell values safely', () => {
    expect(stringifyPdfCell(null)).toBe('');
    expect(stringifyPdfCell(undefined)).toBe('');
    expect(stringifyPdfCell(false)).toBe('false');
    expect(stringifyPdfCell(12)).toBe('12');
    expect(stringifyPdfCell({ nested: ['a'] })).toBe('{"nested":["a"]}');
  });
});
