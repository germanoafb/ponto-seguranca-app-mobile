import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export type Funcao = 'seguranca' | 'bombeiro_civil';

export type GerarPlanilhaParams = {
  cnpj: string;
  contratante: string;
  contratada: string;
  /** Mês/ano no formato AAAA-MM. */
  mesAno: string;
  enderecoTitas: string;
  enderecoContratante: string;
  nomeColaborador: string;
  funcao: Funcao;
};

function formatCargo(funcao: Funcao): string {
  return funcao === 'bombeiro_civil' ? 'Bombeiro Civil' : 'Segurança';
}

function parseMesAno(value: string): { month: number; year: number } | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { month, year };
}

export function isMesAnoValido(value: string): boolean {
  return parseMesAno(value) !== null;
}

/**
 * Gera uma "Folha de Ponto Individual" em .xlsx (mesmo layout usado no painel
 * web: cabeçalho com contratada/contratante/CNPJ/mês/colaborador, seguido de
 * uma linha por dia do mês para preenchimento manual de entrada/intervalo/
 * saída/assinatura) e abre o menu de compartilhamento do sistema.
 *
 * Gerado 100% no dispositivo, sem chamar nenhuma API do painel web.
 */
export async function gerarPlanilhaPonto(params: GerarPlanilhaParams): Promise<void> {
  const parsed = parseMesAno(params.mesAno);
  if (!parsed) {
    throw new Error('Formato de Mês/Ano inválido. Use AAAA-MM.');
  }

  if (
    !params.cnpj.trim() ||
    !params.contratante.trim() ||
    !params.contratada.trim() ||
    !params.enderecoTitas.trim() ||
    !params.enderecoContratante.trim() ||
    !params.nomeColaborador.trim()
  ) {
    throw new Error('Preencha todos os campos antes de gerar a planilha.');
  }

  const { month, year } = parsed;
  const monthYearLabel = `${String(month).padStart(2, '0')}/${year}`;

  const rows: (string | null)[][] = [
    [null, null, null, null, null],
    ['FOLHA DE PONTO INDIVIDUAL', null, null, null, null],
    [`Contratada: ${params.contratada}`, null, null, null, null],
    [`Endereço: ${params.enderecoTitas}`, null, null, null, null],
    [`C.N.P.J.: ${params.cnpj}`, null, null, null, null],
    [`Contratante: ${params.contratante}`, null, null, null, null],
    [`Endereço: ${params.enderecoContratante}`, null, null, null, null],
    [
      `Mês: ${monthYearLabel}.      Colaborador: ${params.nomeColaborador}   Função: ${formatCargo(params.funcao)}`,
      null,
      null,
      null,
      null,
    ],
    ['DIA', 'H.ENTRADA', 'INTERVALO', 'H.SAÍDA', 'ASSINATURA'],
    ['', '07:00', '', '19:00', ''],
  ];

  const totalDays = new Date(year, month, 0).getDate();
  for (let day = 1; day <= totalDays; day += 1) {
    rows.push([`${day}/${month}/${year}`, '', '', '', '']);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 48 }];
  // Linhas 2 a 8 (índice 1 a 7) são o cabeçalho mesclado A:E, igual ao painel web.
  worksheet['!merges'] = [1, 2, 3, 4, 5, 6, 7].map((r) => ({
    s: { r, c: 0 },
    e: { r, c: 4 },
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Folha1');

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

  const safeName =
    params.nomeColaborador
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'colaborador';

  const fileName = `folha-ponto-${safeName}-${monthYearLabel.replace('/', '-')}.xlsx`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Compartilhar planilha',
    });
  }
}
