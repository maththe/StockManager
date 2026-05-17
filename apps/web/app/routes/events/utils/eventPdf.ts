import type { Event } from '~/types/event';

import { eventStatusLabel, formatEventDate, type SelectedEventItem } from './utils';

interface EventPdfGroup {
  categoryName: string;
  items: SelectedEventItem[];
}

const PDF_HEADER = '%PDF-1.4\n%âãÏÓ\n';
const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_MARGIN_LEFT = 40;
const PDF_MARGIN_TOP = 800;
const PDF_FONT_SIZE = 10;
const PDF_LEADING = 14;
const PDF_MAX_LINES_PER_PAGE = 48;
const PDF_MAX_LINE_LENGTH = 88;

const divergenceTypeLabel = {
  MISSING: 'Faltante',
  DAMAGED: 'Avariado',
} as const;

const divergenceStatusLabel = {
  PENDING: 'Pendente',
  RESOLVED: 'Resolvido',
} as const;

function sanitizePdfString(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');
}

function escapePdfText(value: string) {
  return sanitizePdfString(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function toPdfBytes(value: string) {
  const sanitized = sanitizePdfString(value);
  return Uint8Array.from(
    Array.from(sanitized, (character) => character.charCodeAt(0) & 0xff),
  );
}

function chunkLongWord(word: string, maxLength: number) {
  const chunks: string[] = [];

  for (let index = 0; index < word.length; index += maxLength) {
    chunks.push(word.slice(index, index + maxLength));
  }

  return chunks;
}

function wrapText(value: string, maxLength = PDF_MAX_LINE_LENGTH) {
  const normalized = sanitizePdfString(value).replace(/\s+/g, ' ').trim();

  if (!normalized) return [''];

  const words = normalized
    .split(' ')
    .flatMap((word) =>
      word.length > maxLength ? chunkLongWord(word, maxLength) : [word],
    );

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

function pushWrappedLine(
  lines: string[],
  label: string,
  value: string,
  maxLength = PDF_MAX_LINE_LENGTH,
) {
  const safeLabel = sanitizePdfString(label);
  const wrappedValue = wrapText(value || '-', maxLength - safeLabel.length);

  wrappedValue.forEach((line, index) => {
    if (index === 0) {
      lines.push(`${safeLabel}${line}`);
      return;
    }

    lines.push(`${' '.repeat(safeLabel.length)}${line}`);
  });
}

function paginateLines(lines: string[], maxLinesPerPage: number) {
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += maxLinesPerPage) {
    pages.push(lines.slice(index, index + maxLinesPerPage));
  }

  return pages.length > 0 ? pages : [[]];
}

function createContentStream(lines: string[]) {
  const commands = [
    'BT',
    `/F1 ${PDF_FONT_SIZE} Tf`,
    `${PDF_LEADING} TL`,
    `${PDF_MARGIN_LEFT} ${PDF_MARGIN_TOP} Td`,
  ];

  lines.forEach((line, index) => {
    if (index > 0) commands.push('T*');
    commands.push(`(${escapePdfText(line)}) Tj`);
  });

  commands.push('ET');

  return commands.join('\n');
}

function buildPdf(pages: string[][]) {
  const objects: string[] = [''];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  objects.push(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
  );

  for (const pageLines of pages) {
    const contentStream = createContentStream(pageLines);
    const contentObjectId = objects.length;
    contentObjectIds.push(contentObjectId);
    objects.push(
      `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
    );

    pageObjectIds.push(objects.length);
    objects.push('');
  }

  const pagesObjectId = objects.length;
  objects.push('');

  const catalogObjectId = objects.length;
  objects.push('');

  pageObjectIds.forEach((pageObjectId, index) => {
    objects[pageObjectId] =
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 1 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`;
  });

  objects[pagesObjectId] =
    `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [` +
    pageObjectIds.map((pageObjectId) => `${pageObjectId} 0 R`).join(' ') +
    '] >>';

  objects[catalogObjectId] =
    `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`;

  let pdf = PDF_HEADER;
  const offsets = new Array<number>(objects.length).fill(0);

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length} /Root ${catalogObjectId} 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return toPdfBytes(pdf);
}

function formatGeneratedAt(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function buildEventPdfLines(event: Event, groupedItems: EventPdfGroup[]) {
  const totalItems = groupedItems.reduce(
    (count, group) => count + group.items.length,
    0,
  );
  const totalPlannedUnits = groupedItems.reduce(
    (count, group) =>
      count +
      group.items.reduce(
        (sum, eventItem) => sum + (eventItem.plannedQuantity ?? 0),
        0,
      ),
    0,
  );
  const totalShippedUnits = groupedItems.reduce(
    (count, group) =>
      count +
      group.items.reduce((sum, eventItem) => sum + eventItem.shippedQuantity, 0),
    0,
  );
  const totalReturnedUnits = groupedItems.reduce(
    (count, group) =>
      count +
      group.items.reduce((sum, eventItem) => sum + eventItem.returnedQuantity, 0),
    0,
  );

  const lines: string[] = [];

  lines.push('RELATORIO DO EVENTO');
  lines.push(`Gerado em: ${formatGeneratedAt(new Date())}`);
  lines.push('');
  lines.push('DADOS GERAIS');
  lines.push('========================================================');
  pushWrappedLine(lines, 'ID do evento: ', event.id);
  pushWrappedLine(lines, 'Nome: ', event.eventName);
  pushWrappedLine(lines, 'Status: ', eventStatusLabel[event.status]);
  pushWrappedLine(lines, 'Local: ', event.eventLocation || 'Nao informado');
  pushWrappedLine(lines, 'Inicio: ', formatEventDate(event.startDate));
  pushWrappedLine(
    lines,
    'Fim: ',
    event.endDate ? formatEventDate(event.endDate) : 'Nao informado',
  );
  pushWrappedLine(lines, 'Criado em: ', formatEventDate(event.createdAt));
  pushWrappedLine(lines, 'Atualizado em: ', formatEventDate(event.updatedAt));
  lines.push('');
  lines.push('CLIENTE');
  lines.push('========================================================');
  pushWrappedLine(
    lines,
    'Empresa: ',
    event.client?.companyName || 'Cliente nao associado',
  );
  pushWrappedLine(lines, 'Documento: ', event.client?.taxId || 'Nao informado');
  pushWrappedLine(
    lines,
    'Contato: ',
    event.client?.contactName || 'Nao informado',
  );
  lines.push('');
  lines.push('RESPONSAVEL');
  lines.push('========================================================');
  pushWrappedLine(
    lines,
    'Nome: ',
    event.responsible?.name || 'Sem responsavel definido',
  );
  pushWrappedLine(
    lines,
    'Email: ',
    event.responsible?.email || 'Nao informado',
  );
  lines.push('');
  lines.push('RESUMO DOS ITENS');
  lines.push('========================================================');
  pushWrappedLine(lines, 'Categorias: ', String(groupedItems.length));
  pushWrappedLine(lines, 'Itens reservados: ', String(totalItems));
  pushWrappedLine(lines, 'Unidades planejadas: ', String(totalPlannedUnits));
  pushWrappedLine(lines, 'Unidades enviadas: ', String(totalShippedUnits));
  pushWrappedLine(lines, 'Unidades retornadas: ', String(totalReturnedUnits));
  lines.push('');
  lines.push('ITENS');
  lines.push('========================================================');

  if (groupedItems.length === 0) {
    lines.push('Nenhum item reservado neste evento.');
    return lines;
  }

  let itemIndex = 1;

  groupedItems.forEach((group) => {
    lines.push(`Categoria: ${group.categoryName}`);
    lines.push('--------------------------------------------------------');

    group.items.forEach((eventItem) => {
      const totalMissing =
        eventItem.divergences
          ?.filter((divergence) => divergence.type === 'MISSING')
          .reduce((sum, divergence) => sum + divergence.quantity, 0) ?? 0;
      const totalDamaged =
        eventItem.divergences
          ?.filter((divergence) => divergence.type === 'DAMAGED')
          .reduce((sum, divergence) => sum + divergence.quantity, 0) ?? 0;

      pushWrappedLine(lines, `${itemIndex}. Item: `, eventItem.item.name);
      pushWrappedLine(lines, '   Quantidade planejada: ', String(eventItem.plannedQuantity));
      pushWrappedLine(lines, '   Quantidade enviada: ', String(eventItem.shippedQuantity));
      pushWrappedLine(lines, '   Quantidade retornada: ', String(eventItem.returnedQuantity));
      pushWrappedLine(
        lines,
        '   Estoque livre atual: ',
        String(eventItem.item.availableQuantity),
      );
      pushWrappedLine(
        lines,
        '   Estoque total: ',
        String(eventItem.item.totalQuantity),
      );
      pushWrappedLine(lines, '   Faltantes: ', String(totalMissing));
      pushWrappedLine(lines, '   Avariados: ', String(totalDamaged));

      if (eventItem.divergences && eventItem.divergences.length > 0) {
        pushWrappedLine(
          lines,
          '   Divergencias registradas: ',
          String(eventItem.divergences.length),
        );

        eventItem.divergences.forEach((divergence, divergenceIndex) => {
          const summary =
            `${divergenceTypeLabel[divergence.type]} - quantidade ${divergence.quantity} - ` +
            `status ${divergenceStatusLabel[divergence.status]}`;

          pushWrappedLine(
            lines,
            `     ${divergenceIndex + 1}. `,
            summary,
          );

          if (divergence.notes) {
            pushWrappedLine(lines, '        Observacoes: ', divergence.notes);
          }
        });
      }

      lines.push('');
      itemIndex += 1;
    });
  });

  return lines;
}

function createEventPdfFileName(eventName: string) {
  const slug = eventName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'evento'}-detalhes.pdf`;
}

export function downloadEventPdf(event: Event, groupedItems: EventPdfGroup[]) {
  const basePages = paginateLines(
    buildEventPdfLines(event, groupedItems),
    PDF_MAX_LINES_PER_PAGE,
  );

  const pages = basePages.map((pageLines, index) => [
    ...pageLines,
    '',
    `Pagina ${index + 1} de ${basePages.length}`,
  ]);

  const blob = new Blob([buildPdf(pages)], {
    type: 'application/pdf',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = createEventPdfFileName(event.eventName);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}
