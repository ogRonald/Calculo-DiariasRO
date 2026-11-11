'use client';

import { obterHistorico } from '../../services/api';
import { useEffect, useState } from 'react';
import { useDiarias } from '../../contexts/DiariasContext';
import { useRouter } from 'next/navigation';

export default function HistoricoPage() {
  const router = useRouter();
  const { usuario } = useDiarias();
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const dadosUsuario = localStorage.getItem('diarias-user');
    let userLocal = usuario;

    if (!userLocal && dadosUsuario) {
      try {
        userLocal = JSON.parse(dadosUsuario);
      } catch {
        userLocal = null;
      }
    }

    if (!userLocal) {
      router.replace('/login');
      return;
    }

    obterHistorico(userLocal.id)
      .then((dados) => {
        setHistorico(dados || []);
      })
      .catch(() => setHistorico([]))
      .finally(() => setCarregando(false));
  }, [usuario, router]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full text-slate-800 font-sans">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Histórico de consultas</h1>
          <p className="text-slate-500">Acompanhe os cálculos registrados e os servidores beneficiados.</p>
        </div>
        <button 
          onClick={() => router.push('/')} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-lg transition-colors text-sm shadow-sm"
        >
          + Nova Simulação
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                <th className="p-4 px-6">Beneficiário (Viajante)</th>
                <th className="p-4 px-6">Solicitante</th>
                <th className="p-4 px-6">Destino</th>
                <th className="p-4 px-6 text-center">Diárias</th>
                <th className="p-4 px-6 text-right">Valor Total</th>
                <th className="p-4 px-6 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Carregando histórico...</td>
                </tr>
              ) : historico.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum cálculo registrado até o momento.</td>
                </tr>
              ) : (
                historico.map((item) => {
                  // Mapeia todas as possíveis chaves retornadas pelo backend C#
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
                    usuario?.nomeCompleto ?? 
                    'Usuário logado';

                  const valorTotal = Number(item.valorTotalBrl ?? item.ValorTotalBrl ?? 0).toFixed(2);
                  const totalDias = item.totalDias ?? item.TotalDias ?? 0;
                  const destino = item.destino ?? item.Destino ?? '—';
                  const idItem = item.id ?? item.Id;

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
                      <td className="p-4 px-6 text-slate-600">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                          {nomeSolicitante}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-slate-600">{destino}</td>
                      <td className="p-4 px-6 text-center text-slate-600 font-medium">{totalDias} d</td>
                      <td className="p-4 px-6 font-bold text-slate-900 text-right">R$ {valorTotal}</td>
                      <td className="p-4 px-6 text-center">
                        <button
                          onClick={() => window.open(`http://localhost:5211/api/v1/relatorio/${idItem}`, '_blank')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md font-medium transition-colors border border-slate-300 inline-flex items-center gap-1"
                          title="Baixar relatório oficial em PDF"
                        >
                          PDF ↗
                        </button>
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
  );
}