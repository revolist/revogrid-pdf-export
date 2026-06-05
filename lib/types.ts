import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export type PdfCellValue = string | number | boolean | Date | null | undefined | Record<string, unknown> | unknown[];

export type PdfTableData = {
  headers: string[][];
  props: Array<string | number>;
  data: Array<Record<string | number, PdfCellValue>>;
};

export type ResolvedExportPdfOptions = {
  filename: string;
  title: string;
  pageOrientation: 'portrait' | 'landscape';
  includeColumnHeaders: boolean;
  includeGroupHeaders: boolean;
  maxRows?: number;
  tableLayout: string;
};

export type ExportPdfOptions = Partial<ResolvedExportPdfOptions>;

export type BeforePdfExportDetail = {
  data: PdfTableData;
  documentDefinition: TDocumentDefinitions;
  options: ResolvedExportPdfOptions;
};
