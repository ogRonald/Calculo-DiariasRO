const API_URL = 'http://localhost:5211/api/v1';

/**
 * Função utilitária para ir buscar o token ao localStorage 
 * e montar o cabeçalho de Autorização para a API.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('diarias-token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function tratarResposta(response: Response) {
  if (!response.ok) {
    let mensagem = 'Erro na comunicação com a API.';
    
    // Tratamento específico para erros de Token JWT (Fase 2)
    if (response.status === 401) mensagem = 'Não autorizado. A sua sessão expirou, faça login novamente.';
    if (response.status === 403) mensagem = 'Acesso negado. O seu perfil não tem permissão para esta ação.';

    try {
      const dados = await response.json();
      mensagem = dados.erro || mensagem;
    } catch {
      // Mantém a mensagem padrão quando a API não retorna JSON.
    }
    throw new Error(mensagem);
  }

  return response.json();
}

export async function fazerLogin(payload: { matricula: string; senha: string; orgao: string }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await tratarResposta(response);
  
  // Guarda o token devolvido pela API no navegador
  if (data.token) {
    localStorage.setItem('diarias-token', data.token);
  }
  
  // Retorna apenas os dados do utilizador para o frontend usar
  return data.usuario || data;
}

export async function obterPerfil(id: string) {
  const response = await fetch(`${API_URL}/perfil/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

export async function atualizarPerfil(id: string, payload: {
  nomeCompleto: string;
  funcao: string;
  email: string;
  celular: string;
  senha?: string;
}) {
  const response = await fetch(`${API_URL}/perfil/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return tratarResposta(response);
}

export async function simularCalculoDiarias(payload: any) {
  const response = await fetch(`${API_URL}/Diarias/calcular-previa`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return tratarResposta(response);
}

export async function salvarHistorico(payload: any) {
  const response = await fetch(`${API_URL}/historico`, {
    method: 'POST', 
    headers: getAuthHeaders(), 
    body: JSON.stringify(payload),
  });
  return tratarResposta(response);
}

export async function obterHistorico(usuarioId: string) {
  const response = await fetch(`${API_URL}/historico/${usuarioId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

/**
 * Busca todos os cálculos com status 'Pendente' (Apenas para Gestores)
 */
export async function obterPendentes() {
  const response = await fetch(`${API_URL}/Gestao/pendentes`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

/**
 * Aprova uma diária pendente
 */
export async function aprovarDiaria(id: string) {
  const response = await fetch(`${API_URL}/Gestao/${id}/aprovar`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

/**
 * Devolve uma diária exigindo um motivo de correção
 */
export async function devolverDiaria(id: string, motivoDevolucao: string) {
  const response = await fetch(`${API_URL}/Gestao/${id}/devolver`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ motivoDevolucao }),
  });
  return tratarResposta(response);
}