export function mapAuthErrorToPtBr(message?: string): string {
  const msg = (message || '').toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Email ou senha inválidos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email ainda não confirmado.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Este email já está cadastrado.';
  }
  if (msg.includes('project is paused') || msg.includes('project is currently paused')) {
    return 'Projeto Supabase pausado. Contate o administrador.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet.';
  }

  return message || 'Erro inesperado. Tente novamente.';
}
