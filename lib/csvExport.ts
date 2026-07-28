import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import type { PontoRegistro } from './pontos';
import { formatDateTimeBr } from './datetime';

function csvEscape(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportarRelatorioCsv(registros: PontoRegistro[]): Promise<void> {
  const header = ['Data', 'Nome', 'Email', 'Tipo', 'Selfie', 'Observação'];

  const rows = registros.map((item) => [
    item.dataLocal || formatDateTimeBr(item.criadoEmIso),
    item.nome,
    item.email,
    item.tipo,
    item.selfieUrl || '',
    item.observacao || '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(';'))
    .join('\n');

  const fileName = `relatorio-pontos-${new Date().toISOString().slice(0, 10)}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  // BOM (\uFEFF) ajuda o Excel a reconhecer acentuação em UTF-8 corretamente.
  await FileSystem.writeAsStringAsync(fileUri, `\uFEFF${csv}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar relatório',
    });
  }
}
