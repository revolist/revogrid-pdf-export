# RevoGrid PDF Export

Export [RevoGrid](https://rv-grid.com/) data to clean, shareable PDF files with a small browser-side plugin powered by [pdfmake](https://pdfmake.github.io/docs/).

[`@revolist/revogrid-pdf-export`](https://www.npmjs.com/package/@revolist/revogrid-pdf-export) is built for teams that need a practical PDF export button without bringing in a heavy reporting stack. It reads visible [RevoGrid](https://github.com/revolist/revogrid) data, preserves column headers, respects trimmed or filtered rows, and creates a simple [pdfmake document definition](https://pdfmake.github.io/docs/0.1/document-definition-object/) that is ready to download, preview, or customize.

## Why Use It

- Lightweight client-side PDF export for [RevoGrid](https://rv-grid.com/).
- Works with the standard [RevoGrid plugin API](https://rv-grid.com/guide/plugin/).
- Exports visible rows and visible columns.
- Supports grouped column headers.
- Lets you download a PDF, return a browser [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob), or access the [pdfmake document definition](https://pdfmake.github.io/docs/0.1/document-definition-object/).
- Provides a cancelable `beforepdfexport` hook for last-mile customization.
- Keeps the first version intentionally focused: fast to adopt, easy to understand, and simple to extend.

## Install

```sh
npm install @revolist/revogrid-pdf-export
```

## Quick Start

```ts
import { ExportPdfPlugin } from '@revolist/revogrid-pdf-export';

grid.plugins = [ExportPdfPlugin];

const plugins = await grid.getPlugins();
const pdf = plugins.find(plugin => plugin instanceof ExportPdfPlugin);

await pdf?.exportPdf({
  filename: 'orders.pdf',
  title: 'Orders',
});
```

## Demo

The package includes a vanilla [RevoGrid](https://rv-grid.com/) demo with 1,000 rows, served by [Vite](https://vite.dev/):

```sh
npm install
npm run dev
```

Open the local Vite URL and click **Export PDF**.

## API

### `exportPdf(options?)`

Creates and downloads a PDF file.

```ts
await pdf.exportPdf({
  filename: 'orders.pdf',
  title: 'Orders Report',
});
```

### `exportBlob(options?)`

Creates a PDF and returns it as a browser `Blob`. Use this when you want to upload, preview, or handle the file yourself.

```ts
const blob = await pdf.exportBlob({
  title: 'Orders Report',
});
```

### `getDocumentDefinition(options?)`

Returns the [pdfmake document definition](https://pdfmake.github.io/docs/0.1/document-definition-object/) before a PDF is created. This is useful when you want full control over rendering.

```ts
const definition = await pdf.getDocumentDefinition({
  pageOrientation: 'portrait',
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filename` | `string` | `revogrid-export.pdf` | Download filename. `.pdf` is added automatically when omitted. |
| `title` | `string` | `RevoGrid Export` | Title shown above the exported table. |
| `pageOrientation` | `'portrait' \| 'landscape'` | `landscape` | PDF page orientation. |
| `includeColumnHeaders` | `boolean` | `true` | Includes the column header row. |
| `includeGroupHeaders` | `boolean` | `true` | Includes grouped column header rows when present. |
| `maxRows` | `number` | unlimited | Limits exported data rows. |
| `tableLayout` | `string` | `lightHorizontalLines` | [pdfmake table layout](https://pdfmake.github.io/docs/0.1/document-definition-object/tables/) name. |

## Customization

The plugin emits a cancelable `beforepdfexport` event with `{ data, documentDefinition, options }`.

Use it to adjust the [pdfmake document definition](https://pdfmake.github.io/docs/0.1/document-definition-object/), add metadata, change styles, or stop the export.

```ts
grid.addEventListener('beforepdfexport', event => {
  event.detail.documentDefinition.info = {
    title: 'Orders Report',
    subject: 'Monthly order export',
  };

  event.detail.documentDefinition.footer = currentPage => ({
    text: `Page ${currentPage}`,
    alignment: 'center',
    fontSize: 8,
  });
});
```

Call `event.preventDefault()` to cancel the export.

## What Gets Exported

The plugin focuses on data, not pixel-perfect rendering. It exports:

- visible row data
- visible columns
- column names
- grouped column headers
- filtered or trimmed grid state through RevoGrid's visible source APIs

It does not attempt to reproduce custom cell renderers, DOM styling, images, row headers, pinned layout visuals, or editor UI. This keeps the plugin small and predictable.

## Frameworks

The plugin is framework-agnostic. Use it anywhere you can pass RevoGrid plugins:

- [Vanilla JavaScript / TypeScript](https://rv-grid.com/guide/ts/)
- [React](https://rv-grid.com/guide/react/)
- [Vue](https://rv-grid.com/guide/vue3/)
- [Angular](https://rv-grid.com/guide/angular/)
- [Svelte](https://rv-grid.com/guide/svelte/)

## Links

- [RevoGrid website](https://rv-grid.com/)
- [RevoGrid GitHub](https://github.com/revolist/revogrid)
- [RevoGrid PDF Export GitHub](https://github.com/revolist/revogrid-pdf-export)
- [pdfmake documentation](https://pdfmake.github.io/docs/)
- [npm package](https://www.npmjs.com/package/@revolist/revogrid-pdf-export)

## License

MIT
