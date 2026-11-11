'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { obterPendentes } from '@/services/api';

interface DiariaPendente {
  id: string;
  usuarioNome: string;
  destino: string;
  criadoEm: string;
  valorTotalBrl: number;
  status: number;
}

export default function GestaoSolicitacoes() {
  const router = useRouter();
  const [pendentes, setPendentes] = useState<DiariaPendente[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const dados = await obterPendentes();
        setPendentes(dados);
      } catch (erro) {
        console.error("Erro ao buscar pendentes", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50"> 
      <div className="p-8 max-w-7xl mx-auto w-full text-slate-800">
        
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Solicitações pendentes</h1>
          <p className="text-slate-500">Visualize os registros enviados para análise e autorização.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium mb-4">Pendentes</h3>
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {pendentes.length < 10 ? `0${pendentes.length}` : pendentes.length}
            </p>
            <p className="text-xs text-slate-400">Aguardando análise</p>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium mb-4">Aprovadas</h3>
            <p className="text-4xl font-bold text-slate-900 mb-2">--</p>
            <p className="text-xs text-slate-400">Concluídas pelo gestor</p>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium mb-4">Devolvidas</h3>
            <p className="text-4xl font-bold text-slate-900 mb-2">--</p>
            <p className="text-xs text-slate-400">Para correção</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Fila de análise</h2>
            <p className="text-sm text-slate-500">Demonstração visual dos registros com status Pendente.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                  <th className="p-4 px-6">Servidor</th>
                  <th className="p-4 px-6">Destino</th>
                  <th className="p-4 px-6">Data</th>
                  <th className="p-4 px-6">Valor</th>
                  <th className="p-4 px-6">Status</th>
                  <th className="p-4 px-6">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carregando ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">A carregar solicitações...</td></tr>
                ) : pendentes.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhuma solicitação pendente no momento.</td></tr>
                ) : (
                  pendentes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 px-6 font-medium text-slate-900">{item.usuarioNome}</td>
                      <td className="p-4 px-6 text-slate-600">{item.destino}</td>
                      <td className="p-4 px-6 text-slate-600">
                        {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 px-6 font-bold text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotalBrl)}
                      </td>
                      <td className="p-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pendente
                        </span>
                      </td>
                      <td className="p-4 px-6">
                        <button 
                          onClick={() => router.push(`/gestao/${item.id}`)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          Analisar &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}