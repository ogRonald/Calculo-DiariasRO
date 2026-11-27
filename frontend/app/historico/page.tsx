'use client';

import {
  obterHistorico,
  simularCalculoDiarias,
  corrigirHistorico,
} from '../../services/api';
import { useEffect, useState } from 'react';
import { useDiarias } from '../../contexts/DiariasContext';
import { useRouter } from 'next/navigation';

export default function HistoricoPage() {
  const router = useRouter();
  const { usuario, setUsuario } = useDiarias() as any;
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioLocal, setUsuarioLocal] = useState<any>(null);
  const [parecerSelecionado, setParecerSelecionado] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');

  // Estados do Modal de Correção na própria página
  const [itemEmCorrecao, setItemEmCorrecao] = useState<any | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [enviandoCorrecao, setEnviandoCorrecao] = useState(false);
  const [erroCorrecao, setErroCorrecao] = useState('');

  const [formCorrecao, setFormCorrecao] = useState({
    nomeBeneficiario: '',
    matriculaBeneficiario: '',
    orgaoBeneficiario: '',
    destino: '',
    tipoDestino: 'Estadual',
    cargoNivel: 'NivelSuperior',
    dataHoraInicio: '',
    dataHoraFim: '',
    hospedagemInclusa: false,
    acompanhanteJoer: false,
  });

  const [resumoCorrecao, setResumoCorrecao] = useState({
    totalDias: 0,
    valorUnitarioBrl: 0,
    valorTotalBrl: 0,
  });

  const carregarDadosHistorico = async (userId: string) => {
    setCarregando(true);
    try {
      const dados = await obterHistorico(userId);
      setHistorico(dados || []);
    } catch {
      setHistorico([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const dadosUsuario = localStorage.getItem('diarias-user');
    let user = usuario;

    if (dadosUsuario) {
      try {
        const parsed = JSON.parse(dadosUsuario);
        user = parsed;
        setUsuarioLocal(parsed);
        if (!usuario) setUsuario(parsed);
      } catch {
        user = null;
      }
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    carregarDadosHistorico(user.id);
  }, [usuario, setUsuario, router]);

  // Normaliza o status numérico (Enum C#) ou texto
  const normalizarStatus = (status: any): 'Pendente' | 'Aprovado' | 'Devolvido' | 'Rejeitado' => {
    const num = Number(status);
    if (!isNaN(num)) {
      if (num === 1) return 'Aprovado';
      if (num === 2) return 'Devolvido';
      if (num === 3) return 'Rejeitado';
      return 'Pendente';
    }

    if (typeof status === 'string') {
      const s = status.toLowerCase();
      if (s.includes('aprov')) return 'Aprovado';
      if (s.includes('devolv')) return 'Devolvido';
      if (s.includes('rejeit') || s.includes('negad')) return 'Rejeitado';
    }

    return 'Pendente';
  };

  // Abre o modal de correção sem sair da tela de histórico
  const handleCorrigirSolicitacao = (item: any) => {
    setParecerSelecionado(null);
    setErroCorrecao('');
    setItemEmCorrecao(item);

    const inicio = item.dataHoraInicio ?? item.DataHoraInicio ?? '';
    const fim = item.dataHoraFim ?? item.DataHoraFim ?? '';

    setFormCorrecao({
      nomeBeneficiario: item.nomeBeneficiario ?? item.NomeBeneficiario ?? item.servidor ?? '',
      matriculaBeneficiario: item.matriculaBeneficiario ?? item.MatriculaBeneficiario ?? '',
      orgaoBeneficiario: item.orgaoBeneficiario ?? item.OrgaoBeneficiario ?? '',
      destino: item.destino ?? item.Destino ?? '',
      tipoDestino: 'Estadual',
      cargoNivel: 'NivelSuperior',
      dataHoraInicio: inicio ? String(inicio).slice(0, 16) : '',
      dataHoraFim: fim ? String(fim).slice(0, 16) : '',
      hospedagemInclusa: false,
      acompanhanteJoer: false,
    });

    setResumoCorrecao({
      totalDias: Number(item.totalDias ?? item.TotalDias ?? 0),
      valorUnitarioBrl: Number(item.valorUnitarioBrl ?? item.ValorUnitarioBrl ?? 0),
      valorTotalBrl: Number(item.valorTotalBrl ?? item.ValorTotalBrl ?? 0),
    });
  };

  const handleRecalcularCorrecao = async () => {
    setErroCorrecao('');
    if (!formCorrecao.destino || !formCorrecao.dataHoraInicio || !formCorrecao.dataHoraFim) {
      setErroCorrecao('Preencha destino, data/hora de saída e retorno para recalcular.');
      return;
    }

    setCalculando(true);
    try {
      const resultado = await simularCalculoDiarias({
        destino: formCorrecao.destino,
        tipoDestino: formCorrecao.tipoDestino,
        cargoNivel: formCorrecao.cargoNivel,
        dataHoraInicio: formCorrecao.dataHoraInicio,
        dataHoraFim: formCorrecao.dataHoraFim,
        hospedagemInclusa: formCorrecao.hospedagemInclusa,
        acompanhanteJoer: formCorrecao.acompanhanteJoer,
        cursoLongaDuracao: false,
      });

      setResumoCorrecao({
        totalDias: Number(resultado.totalDias ?? resultado.TotalDias ?? 0),
        valorUnitarioBrl: Number(resultado.valorUnitarioBrl ?? resultado.ValorUnitarioBrl ?? 0),
        valorTotalBrl: Number(resultado.valorTotalBrl ?? resultado.ValorTotalBrl ?? 0),
      });
    } catch (err: any) {
      setErroCorrecao(err.message || 'Erro ao recalcular os valores das diárias.');
    } finally {
      setCalculando(false);
    }
  };

  const handleSalvarCorrecao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEmCorrecao) return;

    setErroCorrecao('');
    if (resumoCorrecao.valorTotalBrl <= 0) {
      setErroCorrecao('Clique em "Recalcular" antes de reenviar a solicitação.');
      return;
    }

    const idItem = itemEmCorrecao.id ?? itemEmCorrecao.Id;
    setEnviandoCorrecao(true);

    try {
      await corrigirHistorico(idItem, {
        nomeBeneficiario: formCorrecao.nomeBeneficiario,
        matriculaBeneficiario: formCorrecao.matriculaBeneficiario,
        orgaoBeneficiario: formCorrecao.orgaoBeneficiario,
        destino: formCorrecao.destino,
        dataHoraInicio: formCorrecao.dataHoraInicio,
        dataHoraFim: formCorrecao.dataHoraFim,
        totalDias: resumoCorrecao.totalDias,
        valorUnitarioBrl: resumoCorrecao.valorUnitarioBrl,
        valorTotalBrl: resumoCorrecao.valorTotalBrl,
      });

      setItemEmCorrecao(null);
      setFeedback('Solicitação corrigida e reenviada para análise do gestor!');

      const userId = usuarioLocal?.id ?? usuario?.id;
      if (userId) {
        await carregarDadosHistorico(userId);
      }
    } catch (err: any) {
      setErroCorrecao(err.message || 'Erro ao reenviar a solicitação corrigida.');
    } finally {
      setEnviandoCorrecao(false);
    }
  };

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const totalDevolvidas = historico.filter(
    (h) => normalizarStatus(h.status ?? h.Status) === 'Devolvido'
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full text-slate-800 font-sans">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Histórico de consultas</h1>
          <p className="text-slate-500">Acompanhe os cálculos registrados, pareceres da gestão e os servidores beneficiados.</p>
        </div>
        <button 
          onClick={() => router.push('/')} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap"
        >
          + Nova Simulação
        </button>
      </div>

      {/* Feedback após reenvio */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 flex items-center justify-between text-sm font-medium">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs font-bold opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Alerta caso existam diárias devolvidas aguardando correção */}
      {totalDevolvidas > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0"></span>
          <p>
            Você possui <strong>{totalDevolvidas} {totalDevolvidas === 1 ? 'solicitação devolvida' : 'solicitações devolvidas'}</strong> pelo gestor para ajuste. Clique em <strong>Corrigir</strong> na linha correspondente para editar e reenviar.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <th className="p-4 px-6">Beneficiário (Viajante)</th>
                <th className="p-4 px-6">Solicitante</th>
                <th className="p-4 px-6">Destino</th>
                <th className="p-4 px-6 text-center">Diárias</th>
                <th className="p-4 px-6 text-right">Valor Total</th>
                <th className="p-4 px-6 text-center">Status</th>
                <th className="p-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {carregando ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Carregando histórico...</td>
                </tr>
              ) : historico.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-600 font-medium">Nenhum cálculo registrado até o momento.</td>
                </tr>
              ) : (
                historico.map((item) => {
                  const nomeBeneficiario = 
                    item.nomeBeneficiario ?? 
                    item.NomeBeneficiario ?? 
                    item.servidor ?? 
                    item.beneficiario ?? 
                    'Beneficiário não identificado';

                  const matriculaBeneficiario = 
                    item.matriculaBeneficiario ?? 
                    item.MatriculaBeneficiario ?? 
                    item.matricula ?? 
                    '';

                  const orgaoBeneficiario = 
                    item.orgaoBeneficiario ?? 
                    item.OrgaoBeneficiario ?? 
                    '';

                  const nomeSolicitante = 
                    item.nomeSolicitante ?? 
                    item.NomeSolicitante ?? 
                    item.usuarioNome ?? 
                    item.UsuarioNome ?? 
                    usuarioLocal?.nomeCompleto ?? 
                    usuario?.nomeCompleto ?? 
                    'Solicitante';

                  const valorNumerico = Number(item.valorTotalBrl ?? item.ValorTotalBrl ?? 0);
                  const valorFormatado = formatarMoeda(valorNumerico);

                  const totalDias = item.totalDias ?? item.TotalDias ?? 0;
                  const destino = item.destino ?? item.Destino ?? '—';
                  const idItem = item.id ?? item.Id;
                  const status = normalizarStatus(item.status ?? item.Status);
                  const motivoDevolucao = item.motivoDevolucao ?? item.MotivoDevolucao;

                  return (
                    <tr key={idItem} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 px-6">
                        <p className="font-semibold text-slate-900">{nomeBeneficiario}</p>
                        <p className="text-xs text-slate-600">
                          {matriculaBeneficiario ? `Mat: ${matriculaBeneficiario}` : ''}
                          {matriculaBeneficiario && orgaoBeneficiario ? ' • ' : ''}
                          {orgaoBeneficiario}
                        </p>
                      </td>
                      <td className="p-4 px-6 text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200 whitespace-nowrap">
                          {nomeSolicitante}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-slate-600">{destino}</td>
                      <td className="p-4 px-6 text-center text-slate-600 font-medium whitespace-nowrap">{totalDias} d</td>
                      <td className="p-4 px-6 font-bold text-slate-900 text-right whitespace-nowrap">{valorFormatado}</td>
                      <td className="p-4 px-6 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
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
                          {status === 'Rejeitado' ? 'Negada' : status === 'Aprovado' ? 'Aprovada' : status === 'Devolvido' ? 'Devolvida' : 'Pendente'}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {status === 'Devolvido' && (
                            <button
                              onClick={() => handleCorrigirSolicitacao(item)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap"
                            >
                              Corrigir
                            </button>
                          )}
                          {(status === 'Devolvido' || status === 'Rejeitado' || motivoDevolucao) && (
                            <button
                              onClick={() => setParecerSelecionado({ ...item, statusNormalizado: status, nomeBeneficiario, motivoDevolucao })}
                              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors border whitespace-nowrap ${
                                status === 'Devolvido'
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              }`}
                            >
                              Ver parecer
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`http://localhost:5211/api/v1/relatorio/${idItem}`, '_blank')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md font-medium transition-colors border border-slate-300 inline-flex items-center gap-1 whitespace-nowrap"
                            title="Baixar relatório oficial em PDF"
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

      {/* Modal de Parecer do Gestor (Devolução / Recusa) */}
      {parecerSelecionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  parecerSelecionado.statusNormalizado === 'Devolvido'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {parecerSelecionado.statusNormalizado === 'Devolvido' ? 'Devolvida para Correção' : 'Solicitação Negada'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Parecer da Gestão</h3>
                <p className="text-xs text-slate-500">Beneficiário: {parecerSelecionado.nomeBeneficiario}</p>
              </div>
              <button
                onClick={() => setParecerSelecionado(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm text-slate-700">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Justificativa registrada:</p>
              <p className="leading-relaxed">
                {parecerSelecionado.motivoDevolucao || 'Nenhuma observação adicional foi registrada pelo gestor.'}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setParecerSelecionado(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Fechar
              </button>
              {parecerSelecionado.statusNormalizado === 'Devolvido' && (
                <button
                  onClick={() => handleCorrigirSolicitacao(parecerSelecionado)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Corrigir e Reenviar →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Correção e Reenvio na própria página de Histórico */}
      {itemEmCorrecao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Correção de Diária Devolvida
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1.5">Ajustar e Reenviar Solicitação</h2>
              </div>
              <button
                onClick={() => setItemEmCorrecao(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 border border-amber-200 rounded-lg p-3.5 mb-5 text-xs">
              <p className="font-bold text-amber-800 uppercase mb-0.5">Motivo da Devolução:</p>
              <p className="text-amber-950 leading-relaxed">
                {itemEmCorrecao.motivoDevolucao ?? itemEmCorrecao.MotivoDevolucao ?? 'Ajuste solicitado pela gestão.'}
              </p>
            </div>

            {erroCorrecao && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg">
                {erroCorrecao}
              </div>
            )}

            <form onSubmit={handleSalvarCorrecao} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Beneficiário *</label>
                  <input
                    type="text"
                    required
                    value={formCorrecao.nomeBeneficiario}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, nomeBeneficiario: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Matrícula *</label>
                  <input
                    type="text"
                    required
                    value={formCorrecao.matriculaBeneficiario}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, matriculaBeneficiario: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Órgão *</label>
                  <input
                    type="text"
                    required
                    value={formCorrecao.orgaoBeneficiario}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, orgaoBeneficiario: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Destino *</label>
                  <input
                    type="text"
                    required
                    value={formCorrecao.destino}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, destino: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Saída *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formCorrecao.dataHoraInicio}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, dataHoraInicio: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Retorno *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formCorrecao.dataHoraFim}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, dataHoraFim: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Âmbito</label>
                  <select
                    value={formCorrecao.tipoDestino}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, tipoDestino: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Estadual">Estadual (Rondônia)</option>
                    <option value="Nacional">Nacional (Outros Estados / DF)</option>
                    <option value="Internacional">Internacional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Cargo / Nível</label>
                  <select
                    value={formCorrecao.cargoNivel}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, cargoNivel: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="NivelSuperior">Nível Superior / Técnico</option>
                    <option value="NivelMedio">Nível Médio / Apoio</option>
                    <option value="Direcao">Direção / Chefia</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 text-xs text-slate-700 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formCorrecao.hospedagemInclusa}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, hospedagemInclusa: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Hospedagem custeada pelo órgão
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formCorrecao.acompanhanteJoer}
                    onChange={(e) => setFormCorrecao({ ...formCorrecao, acompanhanteJoer: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Acompanhante JOER
                </label>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Diárias</p>
                    <p className="text-base font-bold text-slate-900">{resumoCorrecao.totalDias} d</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Unitário</p>
                    <p className="text-base font-bold text-slate-900">{formatarMoeda(resumoCorrecao.valorUnitarioBrl)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase">Total</p>
                    <p className="text-base font-extrabold text-emerald-700">{formatarMoeda(resumoCorrecao.valorTotalBrl)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRecalcularCorrecao}
                  disabled={calculando}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {calculando ? 'Calculando...' : 'Recalcular'}
                </button>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemEmCorrecao(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoCorrecao}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {enviandoCorrecao ? 'Reenviando...' : 'Salvar e Reenviar para Aprovação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}