import { describe, expect, it } from 'vitest';
import { GROUP_DEPTH, PSEUDO_GROUP_ITEM } from '@revolist/revogrid';
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

  it('exports nested visible group rows as styled labels in source order', () => {
    const grouped: PdfTableData = {
      headers: data.headers,
      props: data.props,
      data: [
        { [PSEUDO_GROUP_ITEM]: 'North & <East> "Sales"', [GROUP_DEPTH]: 0 },
        { [PSEUDO_GROUP_ITEM]: 'Hardware', [GROUP_DEPTH]: 1 },
        { name: 'Alice', age: 31 },
        { [PSEUDO_GROUP_ITEM]: 'Software', [GROUP_DEPTH]: 1 },
        { name: 'Bob', age: 29 },
        { name: 'Grand total', age: 60 },
      ],
    };

    const body = createPdfTableBody(grouped);

    expect(body.slice(2)).toEqual([
      [
        { text: 'North & <East> "Sales"', colSpan: 3, style: 'groupRow', margin: [0, 0, 0, 0] },
        '',
        '',
      ],
      [
        { text: 'Hardware', colSpan: 3, style: 'groupRow', margin: [12, 0, 0, 0] },
        '',
        '',
      ],
      ['Alice', '31', ''],
      [
        { text: 'Software', colSpan: 3, style: 'groupRow', margin: [12, 0, 0, 0] },
        '',
        '',
      ],
      ['Bob', '29', ''],
      ['Grand total', '60', ''],
    ]);
  });

  it('exports only group and data rows present in a filtered or collapsed visible source', () => {
    const visible: PdfTableData = {
      headers: [['Name', 'Amount']],
      props: ['name', 'amount'],
      data: [
        { [PSEUDO_GROUP_ITEM]: 'Collapsed', [GROUP_DEPTH]: 0 },
        { [PSEUDO_GROUP_ITEM]: 'Filtered', [GROUP_DEPTH]: 0 },
        { name: 'Visible item', amount: 7 },
        { name: 'Grand total', amount: 7 },
      ],
    };

    expect(createPdfTableBody(visible).slice(1).map(row => row[0])).toEqual([
      { text: 'Collapsed', colSpan: 2, style: 'groupRow', margin: [0, 0, 0, 0] },
      { text: 'Filtered', colSpan: 2, style: 'groupRow', margin: [0, 0, 0, 0] },
      'Visible item',
      'Grand total',
    ]);
  });

  it('stringifies supported cell values safely', () => {
    expect(stringifyPdfCell(null)).toBe('');
    expect(stringifyPdfCell(undefined)).toBe('');
    expect(stringifyPdfCell(false)).toBe('false');
    expect(stringifyPdfCell(12)).toBe('12');
    expect(stringifyPdfCell({ nested: ['a'] })).toBe('{"nested":["a"]}');
  });
});
