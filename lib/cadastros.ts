import { supabase } from './supabase';

export type Cadastro = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export async function fetchCadastro(email: string): Promise<Cadastro | null> {
  const { data, error } = await supabase
    .from('cadastros')
    .select('id, name, email, role, active')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Erro ao carregar cadastro.');
  }

  return data;
}

export async function listCadastros(): Promise<Cadastro[]> {
  const { data, error } = await supabase
    .from('cadastros')
    .select('id, name, email, role, active')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Erro ao listar cadastros.');
  }

  return data ?? [];
}

export async function updateCadastroActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('cadastros').update({ active }).eq('id', id);
  if (error) {
    throw new Error(error.message || 'Erro ao atualizar status do usuário.');
  }
}

export async function updateCadastroRole(id: string, role: string): Promise<void> {
  const { error } = await supabase.from('cadastros').update({ role }).eq('id', id);
  if (error) {
    throw new Error(error.message || 'Erro ao atualizar função do usuário.');
  }
}

export async function updateMeuNome(email: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('cadastros')
    .update({ name: name.trim() })
    .eq('email', email.trim().toLowerCase());

  if (error) {
    throw new Error(error.message || 'Erro ao atualizar nome.');
  }
}
