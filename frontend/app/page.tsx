'use client';

import { simularCalculoDiarias } from '../services/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiarias } from '../contexts/DiariasContext'; // Atualizado

export default function NovaSimulacaoPage() {
  const router = useRouter();
  
  // Aceder ao Contexto Global
  const { usuario, setUsuario, formData, atualizarCampoForm, setResultadoCalculo } = useDiarias();
  
  const [autenticado, setAutenticado] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Verificação de Autenticação
  useEffect(() => {
    const auth = localStorage.getItem('diarias-auth');
    const dadosUsuario = localStorage.getItem('diarias-user');

    if (auth !== 'true') {
      router.replace('/login');
      return;
    }

    if (dadosUsuario) {
      try {
        const usuarioLocal = JSON.parse(dadosUsuario);
        const perfilCompleto = Boolean(
          usuarioLocal.nomeCompleto?.trim() && usuarioLocal.funcao?.trim() &&
          usuarioLocal.email?.trim() && usuarioLocal.celular?.trim()
        );

        if (!perfilCompleto) {
          router.replace('/perfil');
          return;
        }

        setUsuario(usuarioLocal);
        setAutenticado(true);
      } catch {
        localStorage.removeItem('diarias-user');
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router, setUsuario]);

  const handleCalcular = async () => {
    setErroValidacao(null);
    
    if (!formData.servidor || !formData.matricula || !formData.orgao || !formData.dataHoraInicio || !formData.dataHoraFim) {
      setErroValidacao("Por favor, preencha todos os dados do servidor e as datas.");
      return;
    }

    const tipoParaApi = Number(formData.tipo) === 2 ? 0 : Number(formData.tipo);
    const payload = {
      categoria: Number(formData.categoria), 
      dataHoraInicio: formData.dataHoraInicio,
      dataHoraFim: formData.dataHoraFim, 
      tipo: tipoParaApi,
      cotacaoDolar: formData.cotacaoDolar ? Number(formData.cotacaoDolar) : null,
      hospedagemInclusa: formData.hospedagemInclusa, 
      custosTotaisTerceiros: formData.custosTotaisTerceiros,
      tipoRegra: formData.tipoRegra, 
      categoriaAutoridadeAcompanhada: null
    };

    try {
      const dados = await simularCalculoDiarias(payload);
      
      if (dados.elegivel) {
        setResultadoCalculo(dados); 
        router.push('/demonstrativo'); // Navega para a página do demonstrativo
      } else {
        setErroValidacao(dados.motivoIneligibilidade);
      }
    } catch (erro: any) {
      setErroValidacao(erro.message || "Erro de comunicação com o servidor.");
    }
  };

  if (!autenticado) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full text-slate-800 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Preencha os dados abaixo para visualizar uma estimativa de diárias de viagem.</h1>
        <p className="text-slate-500"></p>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold mb-1">Cálculo mais simples, transparente e organizado.</h2>
          <p className="text-slate-300 text-sm">Simule valores em poucos passos e mantenha seu histórico de consultas.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
          01 de 02 • Simulação
        </div>
      </div>

      <div className="space-y-6">
        {erroValidacao && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-sm font-medium rounded-r-md">Atenção: {erroValidacao}</div>
        )}

        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="font-bold text-slate-900">Dados do beneficiário</h3>
              <p className="text-xs text-slate-500">Identifique o servidor que receberá as diárias.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <input type="text" value={formData.servidor} onChange={(e) => atualizarCampoForm('servidor', e.target.value)} placeholder="Ex: Maria Oliveira" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
              <input type="text" value={formData.matricula} onChange={(e) => atualizarCampoForm('matricula', e.target.value)} placeholder="000000" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Órgão / secretaria</label>
              <input type="text" value={formData.orgao} onChange={(e) => atualizarCampoForm('orgao', e.target.value)} placeholder="Informe o órgão" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="font-bold text-slate-900">Informações da viagem</h3>
              <p className="text-xs text-slate-500">Configure período, destino e categoria do servidor.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
              <input type="text" value={formData.destino} onChange={(e) => atualizarCampoForm('destino', e.target.value)} placeholder="Cidade de destino" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Abrangência</label>
              <select value={formData.tipo} onChange={(e) => atualizarCampoForm('tipo', Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                <option value={2}>Estadual (Dentro de RO)</option>
                <option value={0}>Nacional (Fora de RO)</option>
                <option value={1}>Internacional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria do cargo</label>
              <select value={formData.categoria} onChange={(e) => atualizarCampoForm('categoria', Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                <option value={1}>1 - Governador e Vice</option>
                <option value={2}>2 - Secretários e Equivalentes</option>
                <option value={3}>3 - Gerência Superior e Procuradores</option>
                <option value={4}>4 - Gerência Intermediária e Demais</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data e hora de partida</label>
              <input type="datetime-local" value={formData.dataHoraInicio} onChange={(e) => atualizarCampoForm('dataHoraInicio', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data e hora de retorno</label>
              <input type="datetime-local" value={formData.dataHoraFim} onChange={(e) => atualizarCampoForm('dataHoraFim', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="font-bold text-slate-900">Regras e condições</h3>
              <p className="text-xs text-slate-500">Verifique as condições antes de gerar sua simulação.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Regra especial</label>
              <select value={formData.tipoRegra} onChange={(e) => atualizarCampoForm('tipoRegra', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white mb-4">
                <option value="Padrao">Padrão (Sem redutor adicional)</option>
                <option value="CursoLongo">Curso/Evento Longo (Mais de 15 dias)</option>
                <option value="AgenteMultiplicador">Agente Multiplicador (50%)</option>
                <option value="JOER">Acompanhante JOER (50%)</option>
              </select>

              {formData.tipo === 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cotação do Dólar (R$)</label>
                  <input type="number" step="0.01" value={formData.cotacaoDolar || ''} onChange={(e) => atualizarCampoForm('cotacaoDolar', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Ex: 5.25" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-4">
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={formData.hospedagemInclusa} onChange={(e) => atualizarCampoForm('hospedagemInclusa', e.target.checked)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded" />
                Hospedagem incluída no evento ou curso
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={formData.custosTotaisTerceiros} onChange={(e) => atualizarCampoForm('custosTotaisTerceiros', e.target.checked)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded" />
                Despesas custeadas integralmente por terceiros
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">

            <button onClick={handleCalcular} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-lg transition-colors w-full sm:w-auto shadow-sm">
              Simular cálculo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}