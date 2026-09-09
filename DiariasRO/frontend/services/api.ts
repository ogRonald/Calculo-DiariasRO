const API_URL = 'http://localhost:5211/api/v1';

export async function simularCalculoDiarias(payload: any) {
  try {
    const response = await fetch(`${API_URL}/Diarias/calcular-previa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.erro || 'Erro na comunicação com a API');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao chamar API:', error);
    throw error;
  }
}