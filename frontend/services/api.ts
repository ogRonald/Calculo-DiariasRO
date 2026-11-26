const API_URL = 'http://localhost:5211/api/v1';

/**
 * Função utilitária para buscar o token no localStorage 
 * e montar o cabeçalho de Autorização para a API.
 */
function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('diarias-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function tratarResposta(response: Response) {
  if (!response.ok) {
    let mensagem = 'Erro na comunicação com a API.';
    
    // Tratamento específico para erros de Token JWT
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
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('diarias-token', data.token);
  }
  
  // Retorna os dados do utilizador para o frontend usar
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
  orgao?: string;
  funcao: string;
  email: string;
  celular: string;
  senha: string;
  novaSenha?: string;
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
 * Busca todas as diárias (Pendentes, Aprovadas, Devolvidas e Rejeitadas) para o Painel da Gestão
 */
export async function obterTodasDiariasGestao(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/Gestao/todas`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Falha ao obter todas as diárias da gestão:', err);
  }

  // Fallback caso a rota ainda não esteja disponível
  return await obterPendentes();
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
 * Busca uma solicitação individual pelo ID
 */
export async function obterDiariaPorId(id: string) {
  const response = await fetch(`${API_URL}/Gestao/${id}`, {
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

/**
 * Rejeita / Nega uma diária
 */
export async function rejeitarDiaria(id: string, motivoDevolucao?: string) {
  const response = await fetch(`${API_URL}/Gestao/${id}/rejeitar`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ motivoDevolucao: motivoDevolucao || 'Solicitação recusada pelo gestor.' }),
  });
  return tratarResposta(response);
}


/**
 * Lista todos os usuários cadastrados (Apenas para Administradores)
 */
export async function listarUsuariosAdmin(): Promise<any[]> {
  const response = await fetch(`${API_URL}/admin/usuarios`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

/**
 * Altera o nível de acesso de um usuário ('Operador' | 'Gestor' | 'Admin')
 */
export async function alterarNivelAcessoUsuario(id: string, nivelAcesso: string) {
  const response = await fetch(`${API_URL}/admin/usuarios/${id}/nivel-acesso`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nivelAcesso }),
  });
  return tratarResposta(response);
}



export async function criarUsuarioAdmin(payload: {
  matricula: string;
  nomeCompleto: string;
  orgao: string;
  funcao?: string;
  email?: string;
  celular?: string;
  nivelAcesso: string;
}) {
  const response = await fetch(`${API_URL}/admin/usuarios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return tratarResposta(response);
}



export async function resetarSenhaUsuarioAdmin(id: string) {
  const response = await fetch(`${API_URL}/admin/usuarios/${id}/resetar-senha`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

export async function trocarSenhaObrigatoria(novaSenha: string) {
  const response = await fetch(`${API_URL}/auth/trocar-senha-obrigatoria`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ novaSenha }),
  });
  return tratarResposta(response);
}

export async function obterItemHistorico(id: string) {
  const response = await fetch(`${API_URL}/historico/item/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return tratarResposta(response);
}

export async function corrigirHistorico(id: string, payload: {
  nomeBeneficiario: string;
  matriculaBeneficiario: string;
  orgaoBeneficiario: string;
  destino: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  totalDias: number;
  valorUnitarioBrl: number;
  valorTotalBrl: number;
}) {
  const response = await fetch(`${API_URL}/historico/${id}/corrigir`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return tratarResposta(response);
}