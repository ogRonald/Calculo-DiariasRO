'use client';

import { obterHistorico } from '../../services/api';
import { useEffect, useState } from 'react';
import { useDiarias } from '../../contexts/DiariasContext';
import { useRouter } from 'next/navigation';

export default function HistoricoPage() {
  const router = useRouter();
  const { usuario, setUsuario, atualizarCampoForm, setFormData } = useDiarias() as any;
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioLocal, setUsuarioLocal] = useState<any>(null);
  const [parecerSelecionado, setParecerSelecionado] = useState<any | null>(null);

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

    obterHistorico(user.id)
      .then((dados) => {
        setHistorico(dados || []);
      })
      .catch(() => setHistorico([]))
      .finally(() => setCarregando(false));
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

  // Preenche o formulário inicial com os dados da diária devolvida para facilitar a correção
  const handleCorrigirSolicitacao = (item: any) => {
    const dadosPreenchidos = {
      servidor: item.nomeBeneficiario ?? item.NomeBeneficiario ?? '',
      matricula: item.matriculaBeneficiario ?? item.MatriculaBeneficiario ?? '',
      orgao: item.orgaoBeneficiario ?? item.OrgaoBeneficiario ?? '',
      destino: item.destino ?? item.Destino ?? '',
      ...(item.dataHoraInicio || item.DataHoraInicio
        ? { dataHoraInicio: String(item.dataHoraInicio ?? item.DataHoraInicio).slice(0, 16) }
        : {}),
      ...(item.dataHoraFim || item.DataHoraFim
        ? { dataHoraFim: String(item.dataHoraFim ?? item.DataHoraFim).slice(0, 16) }
        : {}),
    };

    if (typeof atualizarCampoForm === 'function') {
      Object.entries(dadosPreenchidos).forEach(([campo, valor]) => {
        atualizarCampoForm(campo, valor);
      });
    } else if (typeof setFormData === 'function') {
      setFormData((prev: any) => ({ ...prev, ...dadosPreenchidos }));
    }

    setParecerSelecionado(null);
    router.push('/');
  };

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

      {/* Alerta caso existam diárias devolvidas aguardando correção */}
      {totalDevolvidas > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0"></span>
          <p>
            Você possui <strong>{totalDevolvidas} {totalDevolvidas === 1 ? 'solicitação devolvida' : 'solicitações devolvidas'}</strong> pelo gestor para ajuste. Clique em <strong>Ver parecer</strong> na linha correspondente para conferir as orientações.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
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
                  <td colSpan={7} className="p-8 text-center text-slate-500">Nenhum cálculo registrado até o momento.</td>
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
                  const valorFormatado = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(valorNumerico);

                  const totalDias = item.totalDias ?? item.TotalDias ?? 0;
                  const destino = item.destino ?? item.Destino ?? '—';
                  const idItem = item.id ?? item.Id;
                  const status = normalizarStatus(item.status ?? item.Status);
                  const motivoDevolucao = item.motivoDevolucao ?? item.MotivoDevolucao;

                  return (
                    <tr key={idItem} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 px-6">
                        <p className="font-semibold text-slate-900">{nomeBeneficiario}</p>
                        <p className="text-xs text-slate-400">
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
    </div>
  );
}