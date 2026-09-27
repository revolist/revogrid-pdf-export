import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { getGroupingName, GROUP_DEPTH, isGrouping } from '@revolist/revogrid';
import type { ExportPdfOptions, PdfCellValue, PdfTableData, ResolvedExportPdfOptions } from './types';

export const DEFAULT_PDF_OPTIONS: ResolvedExportPdfOptions = {
  filename: 'revogrid-export.pdf',
  title: 'RevoGrid Export',
  pageOrientation: 'landscape',
  includeColumnHeaders: true,
  includeGroupHeaders: true,
  tableLayout: 'lightHorizontalLines',
};

export function resolvePdfOptions(options: ExportPdfOptions = {}): ResolvedExportPdfOptions {
  return {
    ...DEFAULT_PDF_OPTIONS,
    ...options,
    filename: normalizePdfFilename(options.filename ?? DEFAULT_PDF_OPTIONS.filename),
  };
}

export function createPdfDocumentDefinition(
  data: PdfTableData,
  options: ExportPdfOptions = {},
): TDocumentDefinitions {
  const resolvedOptions = resolvePdfOptions(options);
  const body = createPdfTableBody(data, resolvedOptions);

  return {
    pageOrientation: resolvedOptions.pageOrientation,
    pageMargins: [24, 28, 24, 28],
    content: [
      {
        text: resolvedOptions.title,
        style: 'title',
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          headerRows: getHeaderRowCount(data, resolvedOptions),
          widths: body[0]?.map(() => 'auto') ?? ['*'],
          body,
        },
        layout: resolvedOptions.tableLayout,
      } as Content,
    ],
    styles: {
      title: {
        fontSize: 14,
        bold: true,
      },
      tableHeader: {
        bold: true,
        fillColor: '#eeeeee',
      },
      groupRow: {
        bold: true,
        fillColor: '#e8eef6',
        color: '#24364b',
      },
    },
    defaultStyle: {
      fontSize: 9,
    },
  };
}

export function createPdfTableBody(
  data: PdfTableData,
  options: ExportPdfOptions = {},
): TableCell[][] {
  const resolvedOptions = resolvePdfOptions(options);
  const rows = resolvedOptions.maxRows === undefined
    ? data.data
    : data.data.slice(0, Math.max(0, resolvedOptions.maxRows));
  const headers = getHeaders(data, resolvedOptions);
  const body: TableCell[][] = [];

  headers.forEach(headerRow => {
    body.push(headerRow.map(value => ({ text: stringifyPdfCell(value), style: 'tableHeader' })));
  });

  rows.forEach(row => {
    if (isGrouping(row)) {
      const depth = Math.max(0, Number(row[GROUP_DEPTH]) || 0);
      body.push([
        {
          text: stringifyPdfCell(getGroupingName(row)),
          colSpan: Math.max(1, data.props.length),
          style: 'groupRow',
          margin: [depth * 12, 0, 0, 0],
        },
        ...Array.from({ length: Math.max(0, data.props.length - 1) }, () => ''),
      ]);
      return;
    }
    body.push(data.props.map(prop => stringifyPdfCell(row[prop])));
  });

  if (!body.length) {
    return [[{ text: '', style: 'tableHeader' }]];
  }

  return body;
}

export function stringifyPdfCell(value: PdfCellValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getHeaders(data: PdfTableData, options: ResolvedExportPdfOptions): string[][] {
  if (!options.includeColumnHeaders) {
    return [];
  }

  if (options.includeGroupHeaders) {
    return data.headers;
  }

  return data.headers.length ? [data.headers[data.headers.length - 1]] : [];
}

function getHeaderRowCount(data: PdfTableData, options: ResolvedExportPdfOptions): number {
  return getHeaders(data, options).length;
}

function normalizePdfFilename(filename: string): string {
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
}
