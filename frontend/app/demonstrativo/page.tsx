'use client';

import { useRouter } from 'next/navigation';
import { useDiarias } from '../../contexts/DiariasContext';
import { salvarHistorico } from '../../services/api'; 
import { useState, useEffect } from 'react';

export default function DemonstrativoPage() {
  const router = useRouter();
  const { formData, resultadoCalculo, usuario } = useDiarias();
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!resultadoCalculo) {
      router.push('/');
    }
  }, [resultadoCalculo, router]);

  const handleSalvarHistorico = async () => {
    if (!usuario || !resultadoCalculo?.elegivel) return;
    setSalvando(true);
    try {
      await salvarHistorico({
        usuarioId: usuario.id,
        nomeBeneficiario: formData.servidor,
        matriculaBeneficiario: formData.matricula,
        orgaoBeneficiario: formData.orgao,
        destino: formData.destino,
        dataHoraInicio: formData.dataHoraInicio, 
        dataHoraFim: formData.dataHoraFim,
        totalDias: resultadoCalculo.totalDias, 
        valorUnitarioBrl: resultadoCalculo.valorUnitarioBaseBrl,
        valorTotalBrl: resultadoCalculo.valorTotalBrl
      });
      router.push('/historico');
    } catch (erro: any) { 
      alert(erro.message || 'Não foi possível salvar no histórico.');
      setSalvando(false);
    }
  };

  if (!resultadoCalculo) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full text-slate-800 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Demonstrativo de cálculo</h1>
        <p className="text-slate-500">Confira o resumo da simulação antes de registrar a solicitação.</p>
      </div>
      
      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 border border-amber-100">
        <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
        Prévia para conferência • Este resultado não representa autorização direta de pagamento.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500 mb-2 font-medium">Quantidade calculada</p>
          <p className="text-3xl font-bold text-slate-900">{resultadoCalculo.totalDias} diárias</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500 mb-2 font-medium">Valor unitário base</p>
                    <p className="text-3xl font-bold text-slate-900">{resultadoCalculo.valorUnitarioBaseBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <p className="text-xs text-slate-500 mb-2 font-medium">Valor total estimado</p>
              <p className="text-3xl font-bold text-slate-900">{resultadoCalculo.valorTotalBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm mb-6">
        <h3 className="font-bold text-slate-900 mb-4 text-lg">Envolvidos na Solicitação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-100">
          {/* Card do Beneficiário */}
          <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
              Beneficiário (Quem Viaja)
            </span>
            <p className="text-base font-bold text-slate-900 mt-2">{formData.servidor || 'Não preenchido'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Matrícula: {formData.matricula || '—'} • Órgão: {formData.orgao || '—'}
            </p>
          </div>

          {/* Card do Solicitante */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
              Solicitante (Usuário Logado)
            </span>
            <p className="text-base font-bold text-slate-800 mt-2">{usuario?.nomeCompleto || 'Usuário Atual'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Matrícula: {usuario?.matricula || '—'} • {usuario?.funcao || '—'}
            </p>
          </div>

          <div className="md:col-span-2 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Destino e Abrangência Legal</p>
            <p className="text-sm font-medium text-slate-800">
              {formData.destino} • {formData.tipo === 2 ? 'Estadual (Dentro de Rondônia)' : formData.tipo === 0 ? 'Nacional (Interestadual)' : 'Internacional'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 mt-8">
        <button 
          onClick={() => router.push('/')} 
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-lg transition-colors text-sm shadow-sm"
        >
          ← Voltar à simulação
        </button>
        <button 
          disabled={salvando} 
          onClick={handleSalvarHistorico} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-sm shadow-sm"
        >
          {salvando ? 'Salvando no banco...' : 'Salvar no histórico →'}
        </button>
      </div>
    </div>
  );
}