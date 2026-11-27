'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { obterTodasDiariasGestao, obterPendentes } from '@/services/api';

interface DiariaGestao {
  id: string;
  usuarioNome: string;
  nomeBeneficiario?: string;
  NomeBeneficiario?: string;
  servidor?: string;
  matriculaBeneficiario?: string;
  MatriculaBeneficiario?: string;
  orgaoBeneficiario?: string;
  OrgaoBeneficiario?: string;
  destino: string;
  criadoEm: string;
  dataHoraInicio?: string;
  dataHoraFim?: string;
  totalDias: number;
  valorTotalBrl: number;
  status: 'Pendente' | 'Aprovado' | 'Devolvido' | 'Rejeitado' | number | string;
  motivoDevolucao?: string;
}

export default function DashboardGestao() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<DiariaGestao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados de Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [busca, setBusca] = useState<string>('');

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);
      try {
        // Tenta buscar o conjunto completo; caso indisponível, recorre aos pendentes
        let dados = await obterTodasDiariasGestao();
        if (!dados || dados.length === 0) {
          dados = await obterPendentes();
        }
        setSolicitacoes(dados || []);
      } catch (erro) {
        console.error("Erro ao carregar dados da gestão:", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  // Substitua a função normalizarStatus dentro de app/gestao/page.tsx por:
  const normalizarStatus = (status: any): 'Pendente' | 'Aprovado' | 'Devolvido' | 'Rejeitado' => {
  // Tratamento numérico (padrão de enum do C#)
  const num = Number(status);
  if (!isNaN(num)) {
    if (num === 1) return 'Aprovado';
    if (num === 2) return 'Devolvido';
    if (num === 3) return 'Rejeitado';
    return 'Pendente';
  }

  // Tratamento de string
  if (typeof status === 'string') {
    const s = status.toLowerCase();
    if (s.includes('aprov')) return 'Aprovado';
    if (s.includes('devolv')) return 'Devolvido';
    if (s.includes('rejeit') || s.includes('negad')) return 'Rejeitado';
  }

    return 'Pendente';
};

  // Filtragem Dinâmica
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((item) => {
      const statusNormalizado = normalizarStatus(item.status);
      
      // Filtro de Status
      if (filtroStatus !== 'Todos' && statusNormalizado !== filtroStatus) {
        return false;
      }

      // Filtro por Data de Criação / Solicitação
      const dataItem = item.criadoEm ? new Date(item.criadoEm) : null;
      if (dataInicio && dataItem) {
        const dInicio = new Date(`${dataInicio}T00:00:00`);
        if (dataItem < dInicio) return false;
      }
      if (dataFim && dataItem) {
        const dFim = new Date(`${dataFim}T23:59:59`);
        if (dataItem > dFim) return false;
      }

      // Busca Textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const beneficiario = (item.nomeBeneficiario || item.NomeBeneficiario || item.servidor || item.usuarioNome || '').toLowerCase();
        const matricula = (item.matriculaBeneficiario || item.MatriculaBeneficiario || '').toLowerCase();
        const destino = (item.destino || '').toLowerCase();
        const orgao = (item.orgaoBeneficiario || item.OrgaoBeneficiario || '').toLowerCase();

        return (
          beneficiario.includes(termo) ||
          matricula.includes(termo) ||
          destino.includes(termo) ||
          orgao.includes(termo)
        );
      }

      return true;
    });
  }, [solicitacoes, filtroStatus, dataInicio, dataFim, busca]);

  // Cálculos Consolidados para os Cards
  const metricas = useMemo(() => {
    let qtdPendentes = 0;
    let valorPendentes = 0;
    let qtdAprovadas = 0;
    let valorAprovadas = 0;
    let qtdDevolvidas = 0;
    let valorDevolvidas = 0;
    let qtdRejeitadas = 0;
    let valorRejeitadas = 0;

    solicitacoesFiltradas.forEach((item) => {
      const status = normalizarStatus(item.status);
      const valor = Number(item.valorTotalBrl) || 0;

      if (status === 'Pendente') {
        qtdPendentes++;
        valorPendentes += valor;
      } else if (status === 'Aprovado') {
        qtdAprovadas++;
        valorAprovadas += valor;
      } else if (status === 'Devolvido') {
        qtdDevolvidas++;
        valorDevolvidas += valor;
      } else if (status === 'Rejeitado') {
        qtdRejeitadas++;
        valorRejeitadas += valor;
      }
    });

    const valorTotalGeral = valorAprovadas + valorPendentes + valorDevolvidas + valorRejeitadas;
    const ticketMedio = qtdAprovadas > 0 ? valorAprovadas / qtdAprovadas : 0;

    return {
      qtdPendentes,
      valorPendentes,
      qtdAprovadas,
      valorAprovadas,
      qtdDevolvidas,
      valorDevolvidas,
      qtdRejeitadas,
      valorRejeitadas,
      valorTotalGeral,
      ticketMedio
    };
  }, [solicitacoesFiltradas]);

  // Exportação para Planilha CSV
  const exportarCSV = () => {
    if (solicitacoesFiltradas.length === 0) {
      alert('Nenhum dado disponível para exportação com os filtros atuais.');
      return;
    }

    const cabecalho = ['ID', 'Beneficiario', 'Matricula', 'Orgao', 'Solicitante', 'Destino', 'Data Solicitacao', 'Diarias', 'Valor Total (R$)', 'Status'];
    const linhas = solicitacoesFiltradas.map((item) => [
      item.id,
      `"${item.nomeBeneficiario || item.NomeBeneficiario || item.servidor || item.usuarioNome}"`,
      `"${item.matriculaBeneficiario || item.MatriculaBeneficiario || '—'}"`,
      `"${item.orgaoBeneficiario || item.OrgaoBeneficiario || '—'}"`,
      `"${item.usuarioNome}"`,
      `"${item.destino}"`,
      item.criadoEm ? new Date(item.criadoEm).toLocaleDateString('pt-BR') : '—',
      item.totalDias || 1,
      Number(item.valorTotalBrl || 0).toFixed(2),
      normalizarStatus(item.status)
    ]);

    const conteudoCSV = '\uFEFF' + [cabecalho.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_diarias_sicadi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limparFiltros = () => {
    setFiltroStatus('Todos');
    setDataInicio('');
    setDataFim('');
    setBusca('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto w-full text-slate-800 font-sans">
        
        {/* Cabeçalho da Gestão */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel Gerencial de Diárias</h1>
            <p className="text-slate-500 text-sm mt-1">
              Controle orçamentário, auditoria de processos e autorizações do Estado de Rondônia.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportarCSV}
              className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              Exportar Relatório (CSV)
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
            >
              + Nova Simulação
            </button>
          </div>
        </div>

        {/* Grade de Cards Executivos (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Card: Aprovadas */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aprovadas</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Autorizado</span>
            </div>
                        <p className="text-4xl font-black text-slate-900 mt-2">
              {metricas.qtdAprovadas < 10 ? `0${metricas.qtdAprovadas}` : metricas.qtdAprovadas}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Total Liquidado:</span>
              <span className="text-sm font-bold text-emerald-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorAprovadas)}
              </span>
            </div>
          </div>

          {/* Card: Pendentes */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Em Análise</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">Pendente</span>
            </div>
                        <p className="text-4xl font-black text-slate-900 mt-2">
              {metricas.qtdPendentes < 10 ? `0${metricas.qtdPendentes}` : metricas.qtdPendentes}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Em Estimativa:</span>
              <span className="text-sm font-bold text-amber-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorPendentes)}
              </span>
            </div>
          </div>

          {/* Card: Devolvidas para Correção */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Devolvidas</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">Correção</span>
            </div>
                        <p className="text-4xl font-black text-slate-900 mt-2">
              {metricas.qtdDevolvidas < 10 ? `0${metricas.qtdDevolvidas}` : metricas.qtdDevolvidas}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Valor em Ajuste:</span>
              <span className="text-sm font-bold text-blue-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorDevolvidas)}
              </span>
            </div>
          </div>

          {/* Card: Recusadas / Negadas */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recusadas</span>
              <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">Negado</span>
            </div>
                        <p className="text-4xl font-black text-slate-900 mt-2">
              {metricas.qtdRejeitadas < 10 ? `0${metricas.qtdRejeitadas}` : metricas.qtdRejeitadas}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Economia Gerada:</span>
              <span className="text-sm font-bold text-rose-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorRejeitadas)}
              </span>
            </div>
          </div>

        </div>

        {/* Barra de Filtros Integrados */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {['Todos', 'Pendente', 'Aprovado', 'Devolvido', 'Rejeitado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatus(st)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    filtroStatus === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'Rejeitado' ? 'Negadas' : st === 'Pendente' ? 'Pendentes' : st}
                </button>
              ))}
            </div>

            {/* Filtros de Datas e Busca */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">De:</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Até:</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {(dataInicio || dataFim || busca || filtroStatus !== 'Todos') && (
                <button
                  onClick={limparFiltros}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 underline"
                >
                  Limpar
                </button>
              )}
            </div>

          </div>

          {/* Campo de Pesquisa Geral */}
          <div className="pt-3 border-t border-slate-100">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por servidor, matrícula, órgão ou cidade de destino..."
              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>
        </div>

        {/* Tabela de Gestão de Diárias */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registros Filtrados</h2>
              <p className="text-xs text-slate-500">
                Mostrando {solicitacoesFiltradas.length} de {solicitacoes.length} solicitações cadastradas.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Subtotal em tela: <strong className="text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(solicitacoesFiltradas.reduce((acc, curr) => acc + (Number(curr.valorTotalBrl) || 0), 0))}</strong>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <th className="p-4 px-6">Beneficiário (Viajante)</th>
                  <th className="p-4 px-6">Destino</th>
                  <th className="p-4 px-6">Data Solicitação</th>
                  <th className="p-4 px-6 text-center">Diárias</th>
                  <th className="p-4 px-6 text-right">Valor Estimado</th>
                  <th className="p-4 px-6 text-center">Status</th>
                  <th className="p-4 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Carregando dados gerenciais...
                    </td>
                  </tr>
                ) : solicitacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  solicitacoesFiltradas.map((item) => {
                    const status = normalizarStatus(item.status);
                    const beneficiario = item.nomeBeneficiario || item.NomeBeneficiario || item.servidor || item.usuarioNome;
                    const matricula = item.matriculaBeneficiario || item.MatriculaBeneficiario;
                    const orgao = item.orgaoBeneficiario || item.OrgaoBeneficiario;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 px-6">
                          <p className="font-semibold text-slate-900">{beneficiario}</p>
                          <p className="text-xs text-slate-400">
                            {matricula ? `Mat: ${matricula}` : ''}
                            {matricula && orgao ? ' • ' : ''}
                            {orgao}
                          </p>
                        </td>
                        <td className="p-4 px-6 text-slate-600 font-medium">{item.destino}</td>
                        <td className="p-4 px-6 text-slate-500 text-xs">
                          {item.criadoEm ? new Date(item.criadoEm).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="p-4 px-6 text-center text-slate-700 font-medium">
                          {item.totalDias ? `${item.totalDias} d` : '—'}
                        </td>
                        <td className="p-4 px-6 font-bold text-slate-900 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotalBrl)}
                        </td>
                        <td className="p-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            status === 'Aprovado'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'Devolvido'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : status === 'Rejeitado'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              status === 'Aprovado' ? 'bg-emerald-500' :
                              status === 'Devolvido' ? 'bg-blue-500' :
                              status === 'Rejeitado' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></span>
                            {status === 'Rejeitado' ? 'Negada' : status}
                          </span>
                        </td>
                        <td className="p-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/gestao/${item.id}`)}
                              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Analisar &rarr;
                            </button>
                            <button
                              onClick={() => window.open(`http://localhost:5211/api/v1/relatorio/${item.id}`, '_blank')}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 transition-colors"
                              title="Visualizar PDF"
                            >
                              PDF ↗
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}