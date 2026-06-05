import { defineCustomElements } from '@revolist/revogrid/loader';
import type { ColumnRegular, PluginBaseComponent } from '@revolist/revogrid';
import { ExportPdfPlugin } from '../../lib';
import './style.css';

type OrderRow = {
  order: string;
  customer: string;
  region: string;
  total: number;
  status: string;
};

const grid = document.querySelector<HTMLRevoGridElement>('#grid');
const button = document.querySelector<HTMLButtonElement>('#export-pdf');

const columns: ColumnRegular[] = [
  { prop: 'order', name: 'Order', size: 120 },
  { prop: 'customer', name: 'Customer', size: 170 },
  { prop: 'region', name: 'Region', size: 120 },
  { prop: 'total', name: 'Total', size: 110 },
  { prop: 'status', name: 'Status', size: 130 },
];

const customers = [
  'Northwind Traders',
  'Contoso Retail',
  'Fabrikam Supply',
  'Adventure Works',
  'Tailspin Toys',
];
const regions = ['EMEA', 'NA', 'APAC', 'LATAM'];
const statuses = ['Paid', 'Pending', 'Draft'];

const source: OrderRow[] = Array.from({ length: 1_000 }, (_, index) => ({
  order: `SO-${String(index + 1001).padStart(4, '0')}`,
  customer: customers[index % customers.length],
  region: regions[index % regions.length],
  total: 500 + ((index * 137) % 4_500),
  status: statuses[index % statuses.length],
}));

await defineCustomElements();

if (grid) {
  grid.columns = columns;
  grid.source = source;
  grid.plugins = [ExportPdfPlugin];
}

button?.addEventListener('click', async () => {
  if (!grid) {
    return;
  }

  button.disabled = true;

  try {
    const plugins = await grid.getPlugins();
    const pdfPlugin = plugins.find((plugin: PluginBaseComponent) => plugin instanceof ExportPdfPlugin);
    await (pdfPlugin as ExportPdfPlugin | undefined)?.exportPdf({
      filename: 'revogrid-demo.pdf',
      title: 'RevoGrid PDF Demo',
    });
  } finally {
    button.disabled = false;
  }
});
