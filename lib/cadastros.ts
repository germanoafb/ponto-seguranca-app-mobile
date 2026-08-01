import { supabase } from './supabase';

export type Cadastro = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export type SignUpResult = {
  /** true quando já existe sessão (confirmação de email desativada no projeto). */
  hasSession: boolean;
};

/**
 * Cadastro (sign up) feito 100% pelo app, sem depender do painel web nem de
 * credencial de admin do Supabase. O registro em `cadastros` é criado
 * automaticamente por um trigger no banco (on_auth_user_created) assim que o
 * usuário é criado em auth.users.
 */
export async function signUpCadastro(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim().toLowerCase(),
    password: params.password,
    options: {
      data: {
        name: params.name.trim(),
        phone: params.phone?.trim() || null,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao criar cadastro.');
  }

  return { hasSession: !!data.session };
}

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
