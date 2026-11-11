'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obterDiariaPorId, obterTodasDiariasGestao, aprovarDiaria, devolverDiaria, rejeitarDiaria } from '@/services/api';

export default function AnaliseIndividual() {
  const { id } = useParams();
  const router = useRouter();
  
  const [diaria, setDiaria] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estados para o fluxo de Devolução / Recusa
  const [exibirDevolucao, setExibirDevolucao] = useState(false);
  const [tipoAcao, setTipoAcao] = useState<'Devolver' | 'Rejeitar'>('Devolver');
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        let item = null;
        try {
          item = await obterDiariaPorId(id as string);
        } catch {
          const todas = await obterTodasDiariasGestao();
          item = todas.find((d: any) => String(d.id || d.Id) === String(id));
        }

        if (item) {
          setDiaria(item);
        } else {
          alert('Solicitação não encontrada.');
          router.push('/gestao');
        }
      } catch (erro) {
        console.error(erro);
      } finally {
        setCarregando(false);
      }
    }
    if (id) carregarDados();
  }, [id, router]);

  const handleAprovar = async () => {
    if (!confirm('Tem a certeza que deseja aprovar este cálculo?')) return;
    
    setProcessando(true);
    try {
      await aprovarDiaria(id as string);
      alert('Cálculo aprovado com sucesso!');
      router.push('/gestao'); 
    } catch {
      alert('Erro ao aprovar a diária.');
      setProcessando(false);
    }
  };

  const handleConfirmarAcaoComMotivo = async () => {
    if (motivo.trim().length === 0) {
      alert('É obrigatório informar a justificativa.');
      return;
    }

    setProcessando(true);
    try {
      if (tipoAcao === 'Devolver') {
        await devolverDiaria(id as string, motivo);
        alert('Solicitação devolvida para correção.');
      } else {
        await rejeitarDiaria(id as string, motivo);
        alert('Solicitação rejeitada com sucesso.');
      }
      router.push('/gestao');
    } catch {
      alert(`Erro ao ${tipoAcao.toLowerCase()} a diária.`);
      setProcessando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium text-sm">Carregando detalhes do processo...</div>
      </div>
    );
  }
  
  if (!diaria) return null;

  const nomeBeneficiario = diaria.nomeBeneficiario ?? diaria.NomeBeneficiario ?? diaria.servidor ?? diaria.usuarioNome;
  const matriculaBeneficiario = diaria.matriculaBeneficiario ?? diaria.MatriculaBeneficiario ?? '—';
  const orgaoBeneficiario = diaria.orgaoBeneficiario ?? diaria.OrgaoBeneficiario ?? diaria.usuarioOrgao ?? '—';
  const solicitanteNome = diaria.usuarioNome ?? diaria.nomeSolicitante ?? 'Sistema';
  
  const statusNum = Number(diaria.status);
  const isPendente = diaria.status === 'Pendente' || statusNum === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-4xl mx-auto w-full text-slate-800 font-sans">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/gestao')}
              className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold"
            >
              &larr; Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Análise de Solicitação</h1>
              <p className="text-slate-500 text-xs mt-0.5">Identificador do processo: {diaria.id}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
            diaria.status === 'Aprovado' || statusNum === 1
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : diaria.status === 'Devolvido' || statusNum === 2
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : diaria.status === 'Rejeitado' || statusNum === 3
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            • {isPendente ? 'Pendente' : diaria.status === 'Aprovado' || statusNum === 1 ? 'Aprovada' : diaria.status === 'Devolvido' || statusNum === 2 ? 'Devolvida' : 'Recusada'}
          </span>
        </div>

        {/* Cards de Valores Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Valor Total Solicitado</h3>
              <p className="text-3xl font-extrabold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diaria.valorTotalBrl)}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Duração: <strong>{diaria.totalDias ?? 1} diárias</strong></span>
              <button
                onClick={() => window.open(`http://localhost:5211/api/v1/relatorio/${diaria.id}`, '_blank')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Abrir PDF ↗
              </button>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-2">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                Beneficiário (Viajante)
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">{nomeBeneficiario}</p>
              <p className="text-xs text-slate-500">Matrícula: {matriculaBeneficiario} • Órgão: {orgaoBeneficiario}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
              <p className="mb-1"><strong>Solicitado por:</strong> {solicitanteNome}</p>
              <p className="mb-1"><strong>Destino:</strong> {diaria.destino}</p>
              <p>
                <strong>Data da Solicitação:</strong> {diaria.criadoEm ? new Date(diaria.criadoEm).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Despacho ou Informação de Conclusão */}
        {isPendente ? (
          !exibirDevolucao ? (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600 font-medium">Decisão da autoridade para esta solicitação:</p>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => { setTipoAcao('Rejeitar'); setExibirDevolucao(true); }}
                  disabled={processando}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  Recusar
                </button>
                <button 
                  onClick={() => { setTipoAcao('Devolver'); setExibirDevolucao(true); }}
                  disabled={processando}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Devolver
                </button>
                <button 
                  onClick={handleAprovar}
                  disabled={processando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  {processando ? 'Processando...' : 'Aprovar Diária'}
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-xl border ${tipoAcao === 'Devolver' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
              <h3 className={`font-bold mb-1 text-sm ${tipoAcao === 'Devolver' ? 'text-amber-900' : 'text-rose-900'}`}>
                {tipoAcao === 'Devolver' ? 'Motivo da Devolução para Correção' : 'Motivo da Recusa da Diária'}
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Descreva a justificativa para que o servidor tome conhecimento.
              </p>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={tipoAcao === 'Devolver' ? "Ex: Anexar portaria de convocação da SEDUC..." : "Ex: Viagem não condiz com as atribuições do cargo..."}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setExibirDevolucao(false)}
                  disabled={processando}
                  className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmarAcaoComMotivo}
                  disabled={processando}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs ${tipoAcao === 'Devolver' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {processando ? 'Gravando...' : `Confirmar ${tipoAcao}`}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="bg-slate-100 border border-slate-200 p-5 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>Processo finalizado pelo gestor com status <strong>{diaria.status}</strong>.</span>
            {diaria.motivoDevolucao && (
              <span className="italic">Justificativa: &quot;{diaria.motivoDevolucao}&quot;</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}