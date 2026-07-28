import { supabase } from './supabase';
import type { PontoRegistro, PontoTipo } from './pontos';

type PontoRow = {
  created_at: string;
  data_local: string | null;
  email: string;
  nome: string;
  role: string;
  tipo: PontoTipo;
  latitude: number | null;
  longitude: number | null;
  selfie_url: string | null;
  observacao: string | null;
};

function mapRowToRegistro(row: PontoRow): PontoRegistro {
  return {
    criadoEmIso: row.created_at,
    dataLocal: row.data_local || '',
    email: row.email,
    nome: row.nome,
    role: row.role,
    tipo: row.tipo,
    latitude: row.latitude,
    longitude: row.longitude,
    selfieUrl: row.selfie_url,
    observacao: row.observacao,
  };
}

export type RelatorioFiltros = {
  query?: string;
  fromIso?: string | null;
  toIso?: string | null;
};

export async function listRelatorio(filtros: RelatorioFiltros = {}): Promise<PontoRegistro[]> {
  let queryBuilder = supabase
    .from('pontos')
    .select(
      'created_at, data_local, email, nome, role, tipo, latitude, longitude, selfie_url, observacao'
    )
    .order('created_at', { ascending: false });

  if (filtros.fromIso) {
    queryBuilder = queryBuilder.gte('created_at', filtros.fromIso);
  }
  if (filtros.toIso) {
    queryBuilder = queryBuilder.lte('created_at', filtros.toIso);
  }
  if (filtros.query?.trim()) {
    const term = filtros.query.trim();
    queryBuilder = queryBuilder.or(`email.ilike.%${term}%,nome.ilike.%${term}%`);
  }

  const { data, error } = await queryBuilder.limit(500);

  if (error) {
    throw new Error(error.message || 'Erro ao carregar relatório.');
  }

  return (data as PontoRow[]).map(mapRowToRegistro);
}
