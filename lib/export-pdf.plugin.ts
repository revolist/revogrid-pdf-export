import {
  BasePlugin,
  type ColumnRegular,
  type DimensionCols,
  type DimensionRows,
} from '@revolist/revogrid';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { createPdfDocumentDefinition, resolvePdfOptions } from './pdf-format';
import type {
  BeforePdfExportDetail,
  ExportPdfOptions,
  PdfTableData,
  ResolvedExportPdfOptions,
} from './types';

const ROW_TYPES: DimensionRows[] = ['rowPinStart', 'rgRow', 'rowPinEnd'];
const COLUMN_TYPES: DimensionCols[] = ['colPinStart', 'rgCol', 'colPinEnd'];

type ColumnGroups = Record<number, Array<{ name: string; indexes: number[] }>>;

type PdfMakeWithFonts = typeof pdfMake & {
  addVirtualFileSystem?: (fonts: unknown) => void;
  vfs?: Record<string, string>;
};

const pdfMakeWithFonts = pdfMake as PdfMakeWithFonts;
const pdfFontsSource = pdfFonts as { pdfMake?: { vfs?: unknown }; vfs?: unknown };
const vfs = pdfFontsSource.pdfMake?.vfs ?? pdfFontsSource.vfs;

if (typeof pdfMakeWithFonts.addVirtualFileSystem === 'function') {
  pdfMakeWithFonts.addVirtualFileSystem(pdfFonts);
} else if (vfs) {
  pdfMakeWithFonts.vfs = vfs as Record<string, string>;
}

export class ExportPdfPlugin extends BasePlugin {
  async exportPdf(options: ExportPdfOptions = {}): Promise<void> {
    const resolvedOptions = resolvePdfOptions(options);
    const documentDefinition = await this.getDocumentDefinition(resolvedOptions);

    if (!documentDefinition) {
      return;
    }

    pdfMake.createPdf(documentDefinition).download(resolvedOptions.filename);
  }

  async exportBlob(options: ExportPdfOptions = {}): Promise<Blob | null> {
    const documentDefinition = await this.getDocumentDefinition(options);

    if (!documentDefinition) {
      return null;
    }

    return pdfMake.createPdf(documentDefinition).getBlob();
  }

  async getDocumentDefinition(options: ExportPdfOptions = {}): Promise<TDocumentDefinitions | null> {
    const resolvedOptions = resolvePdfOptions(options);
    const data = await this.getData(resolvedOptions);
    const documentDefinition = createPdfDocumentDefinition(data, resolvedOptions);
    const event = this.emit<BeforePdfExportDetail>('beforepdfexport', {
      data,
      documentDefinition,
      options: resolvedOptions,
    });

    if (event.defaultPrevented) {
      return null;
    }

    return event.detail.documentDefinition;
  }

  private async getData(options: ResolvedExportPdfOptions): Promise<PdfTableData> {
    const [data, columns] = await Promise.all([
      this.getSource(options),
      this.getColumns(),
    ]);

    return {
      data,
      ...columns,
    };
  }

  private async getSource(options: ResolvedExportPdfOptions): Promise<PdfTableData['data']> {
    const rowSources = await Promise.all(
      ROW_TYPES.map(type => this.revogrid.getVisibleSource(type) as Promise<PdfTableData['data']>),
    );
    const rows = rowSources.flat();

    if (options.maxRows === undefined) {
      return rows;
    }

    return rows.slice(0, Math.max(0, options.maxRows));
  }

  private async getColumns(): Promise<Pick<PdfTableData, 'headers' | 'props'>> {
    const columnsPerType = await Promise.all(COLUMN_TYPES.map(type => this.getColumnsByType(type)));

    return columnsPerType.reduce<Pick<PdfTableData, 'headers' | 'props'>>(
      (result, source) => {
        source.headers.forEach((headerRow, index) => {
          if (!result.headers[index]) {
            result.headers[index] = [];
          }
          result.headers[index].push(...headerRow);
        });
        result.props.push(...source.props);
        return result;
      },
      { headers: [], props: [] },
    );
  }

  private async getColumnsByType(type: DimensionCols): Promise<Pick<PdfTableData, 'headers' | 'props'>> {
    const store = await this.revogrid.getColumnStore(type);
    const source = store.get('source') as ColumnRegular[];
    const virtualIndexes = store.get('items') as number[];
    const groupingDepth = store.get('groupingDepth') as number;
    const groups = store.get('groups') as ColumnGroups;
    const names: string[] = [];
    const props: PdfTableData['props'] = [];

    virtualIndexes.forEach(index => {
      const column = source[index];

      if (!column) {
        return;
      }

      names.push(column.name || String(column.prop));
      props.push(column.prop);
    });

    const headers = this.getGroupHeaders(groupingDepth, groups, virtualIndexes);
    headers.push(names);

    return {
      headers,
      props,
    };
  }

  private getGroupHeaders(depth: number, groups: ColumnGroups, virtualIndexes: number[]): string[][] {
    const rows = Array.from({ length: depth }, () => Array.from({ length: virtualIndexes.length }, () => ''));

    for (let level = 0; level < depth; level += 1) {
      const levelGroups = groups[level];

      if (!levelGroups) {
        continue;
      }

      levelGroups.forEach(group => {
        const firstGroupIndex = group.indexes[0];
        const visiblePosition = virtualIndexes.indexOf(firstGroupIndex);

        if (visiblePosition > -1) {
          rows[level][visiblePosition] = group.name;
        }
      });
    }

    return rows;
  }
}
