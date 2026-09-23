const API_URL = 'http://localhost:5211/api/v1';

async function tratarResposta(response: Response) {
  if (!response.ok) {
    let mensagem = 'Erro na comunicação com a API.';
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

  return tratarResposta(response);
}

export async function obterPerfil(id: string) {
  const response = await fetch(`${API_URL}/perfil/${id}`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return tratarResposta(response);
}

export async function simularCalculoDiarias(payload: any) {
  const response = await fetch(`${API_URL}/Diarias/calcular-previa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return tratarResposta(response);
}

export async function salvarHistorico(payload: any) {
  const response = await fetch(`${API_URL}/historico`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return tratarResposta(response);
}

export async function obterHistorico(usuarioId: string) {
  const response = await fetch(`${API_URL}/historico/${usuarioId}`);
  return tratarResposta(response);
}
