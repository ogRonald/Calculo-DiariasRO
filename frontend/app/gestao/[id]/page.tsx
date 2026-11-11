'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obterPendentes, aprovarDiaria, devolverDiaria } from '@/services/api';

export default function AnaliseIndividual() {
  const { id } = useParams();
  const router = useRouter();
  
  const [diaria, setDiaria] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estados para o fluxo de Devolução
  const [exibirDevolucao, setExibirDevolucao] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const pendentes = await obterPendentes();
        const encontrada = pendentes.find((d: any) => d.id === id);
        if (encontrada) {
          setDiaria(encontrada);
        } else {
          alert('Solicitação não encontrada ou já processada.');
          router.push('/gestao');
        }
      } catch (erro) {
        console.error(erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [id, router]);

  const handleAprovar = async () => {
    if (!confirm('Tem a certeza que deseja aprovar este cálculo?')) return;
    
    setProcessando(true);
    try {
      await aprovarDiaria(id as string);
      alert('Cálculo aprovado com sucesso!');
      router.push('/gestao'); 
    } catch (erro) {
      alert('Erro ao aprovar a diária.');
      setProcessando(false);
    }
  };

  const handleDevolver = async () => {
    if (motivo.trim().length === 0) {
      alert('É obrigatório informar o motivo da devolução.');
      return;
    }

    setProcessando(true);
    try {
      await devolverDiaria(id as string, motivo);
      alert('Solicitação devolvida para correção.');
      router.push('/gestao');
    } catch (erro) {
      alert('Erro ao devolver a diária.');
      setProcessando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">A carregar detalhes...</div>
      </div>
    );
  }
  
  if (!diaria) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-4xl mx-auto w-full text-slate-800">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/gestao')}
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            &larr; Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Análise de Solicitação</h1>
            <p className="text-slate-500">Confira os detalhes antes de aprovar ou devolver o cálculo.</p>
          </div>
        </div>

        {/* Cards de Valores Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium mb-1">Valor total estimado</h3>
            <p className="text-4xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diaria.valorTotalBrl)}
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col justify-center">
            <p className="text-sm text-slate-600 mb-1"><strong>Beneficiário:</strong> {diaria.usuarioNome}</p>
            <p className="text-sm text-slate-600 mb-1"><strong>Órgão:</strong> {diaria.usuarioOrgao}</p>
            <p className="text-sm text-slate-600 mb-1"><strong>Destino:</strong> {diaria.destino}</p>
            <p className="text-sm text-slate-600">
              <strong>Data da Solicitação:</strong> {new Date(diaria.criadoEm).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Área de Ações */}
        {!exibirDevolucao ? (
          <div className="bg-slate-100 border border-slate-200 p-6 rounded-xl flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">Selecione a ação desejada para esta solicitação:</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setExibirDevolucao(true)}
                disabled={processando}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Devolver para correção
              </button>
              <button 
                onClick={handleAprovar}
                disabled={processando}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {processando ? 'Processando...' : 'Aprovar cálculo'}
              </button>
            </div>
          </div>
        ) : (
          /* Caixa de Motivo de Devolução */
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl animate-in fade-in duration-300">
            <h3 className="text-rose-900 font-bold mb-2">Motivo da devolução</h3>
            <p className="text-sm text-rose-700 mb-4">
              Justifique o motivo da devolução. Esta mensagem será exibida ao servidor que realizou a solicitação.
            </p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Falta anexar a portaria de autorização da viagem..."
              className="w-full p-4 border border-rose-200 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={4}
            />
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setExibirDevolucao(false)}
                disabled={processando}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium px-4 py-2"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDevolver}
                disabled={processando}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {processando ? 'Enviando...' : 'Confirmar Devolução'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}