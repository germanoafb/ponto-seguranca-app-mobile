import { supabase } from './supabase';
import { formatDateTimeBr } from './datetime';

export type PontoTipo = 'entrada' | 'inicio_descanso' | 'fim_descanso' | 'saida';

export type PontoRegistro = {
  criadoEmIso: string;
  dataLocal: string;
  email: string;
  nome: string;
  role: string;
  tipo: PontoTipo;
  latitude: number | null;
  longitude: number | null;
  selfieUrl: string | null;
  observacao: string | null;
};

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

export async function listMeusPontos(email: string, limit = 30): Promise<PontoRegistro[]> {
  const { data, error } = await supabase
    .from('pontos')
    .select(
      'created_at, data_local, email, nome, role, tipo, latitude, longitude, selfie_url, observacao'
    )
    .eq('email', email.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || 'Erro ao listar pontos.');
  }

  return (data as PontoRow[]).map(mapRowToRegistro);
}

const MIN_BREAK_MINUTES = 20;

/**
 * Mesma regra da antiga API: só pode encerrar o descanso se houver um
 * "inicio_descanso" prévio e já tiverem se passado ao menos 20 minutos.
 * Retorna uma mensagem de erro (string) se a regra for violada, ou null se
 * estiver liberado.
 */
export async function validarFimDescanso(email: string): Promise<string | null> {
  const registros = await listMeusPontos(email);
  const ultimoInicio = registros.find((r) => r.tipo === 'inicio_descanso');

  if (!ultimoInicio) {
    return 'Não existe início de descanso para encerrar.';
  }

  const diffMinutes = Math.floor(
    (Date.now() - new Date(ultimoInicio.criadoEmIso).getTime()) / 60000
  );

  if (diffMinutes < MIN_BREAK_MINUTES) {
    return `Descanso mínimo de ${MIN_BREAK_MINUTES} minutos. Aguarde mais ${
      MIN_BREAK_MINUTES - diffMinutes
    } minuto(s).`;
  }

  return null;
}

export async function criarRegistroPonto(params: {
  email: string;
  nome: string;
  role: string;
  tipo: PontoTipo;
  latitude: number | null;
  longitude: number | null;
  selfieUrl: string;
  observacao: string | null;
}): Promise<void> {
  const now = new Date();

  const { error } = await supabase.from('pontos').insert({
    created_at: now.toISOString(),
    data_local: formatDateTimeBr(now),
    email: params.email.trim().toLowerCase(),
    nome: params.nome,
    role: params.role,
    tipo: params.tipo,
    latitude: params.latitude,
    longitude: params.longitude,
    selfie_url: params.selfieUrl,
    observacao: params.observacao,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao registrar ponto.');
  }
}
