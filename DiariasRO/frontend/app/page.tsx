'use client';
import { simularCalculoDiarias } from '../services/api';
import { useState } from 'react';

export default function CalculadoraDiarias() {
  const [activeTab, setActiveTab] = useState<'form' | 'statement' | 'history'>('form');

  // 1. Estado apenas com dados do solicitante e parâmetros da API
  const [formData, setFormData] = useState({
    servidor: 'Nome',
    matricula: '000.000-0',
    orgao: '',
    destino: 'Cidade',
    categoria: 4,
    tipo: 2, // Inicia como Estadual (2)
    dataHoraInicio: '',
    dataHoraFim: '',
    tipoRegra: 'Padrao',
    cotacaoDolar: '',
    hospedagemInclusa: false,
    custosTotaisTerceiros: false
  });

  // 2. Estados para armazenar a resposta do Backend
  const [resultadoCalculo, setResultadoCalculo] = useState<any>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // 3. Função de submissão para a API
  const handleCalcular = async () => {
    setErroValidacao(null);
    
    // Validação antes de enviar
    if (!formData.dataHoraInicio || !formData.dataHoraFim) {
      setErroValidacao("Por favor, preencha as datas de início e fim da viagem.");
      return;
    }

    // Tradução: Se for Estadual (2), a API calcula usando a tabela Nacional (0)
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
      setResultadoCalculo(dados);
      
      if (dados.elegivel) {
        setActiveTab('statement');
      } else {
        setErroValidacao(dados.motivoIneligibilidade);
      }
    } catch (erro: any) {
      setErroValidacao(erro.message || "Erro de comunicação com o servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <header className="bg-[#0F2C59] text-white p-4 shadow-md border-b-4 border-[#059669]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#059669] rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm">
              RO
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl leading-tight">Governo do Estado de Rondônia</h1>
              <p className="text-xs text-slate-300">Sistema de Calculadora de Diárias de Viagem</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs bg-[#059669] text-white px-3 py-1 rounded-full font-medium">
            Módulo Oficial
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex border-b border-slate-300 mb-6 bg-white rounded-t-lg shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors text-center border-b-2 whitespace-nowrap ${
              activeTab === 'form' ? 'border-[#059669] text-[#0F2C59] bg-slate-50 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            1. Formulário de Solicitante
          </button>
          <button
            onClick={() => { if (resultadoCalculo?.elegivel) setActiveTab('statement'); }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors text-center border-b-2 whitespace-nowrap ${
              activeTab === 'statement' ? 'border-[#059669] text-[#0F2C59] bg-slate-50 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            2. Demonstrativo de Diárias
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors text-center border-b-2 whitespace-nowrap ${
              activeTab === 'history' ? 'border-[#059669] text-[#0F2C59] bg-slate-50 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            3. Histórico de Consultas
          </button>
        </div>

        {activeTab === 'form' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-[#0F2C59]">Preencha os Dados do Cálculo</h2>
              <p className="text-sm text-slate-500">Informe os dados do servidor e os parâmetros da viagem. O sistema calculará automaticamente.</p>
            </div>

            {erroValidacao && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm font-medium rounded-r-md">
                Atenção: {erroValidacao}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.servidor}
                  onChange={(e) => setFormData({ ...formData, servidor: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Órgão / Secretaria</label>
                <input
                  type="text"
                  value={formData.orgao}
                  onChange={(e) => setFormData({ ...formData, orgao: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destino da Viagem</label>
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria do Cargo</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none bg-white"
                >
                  <option value={1}>1 - Governador e Vice</option>
                  <option value={2}>2 - Secretários e Equivalentes</option>
                  <option value={3}>3 - Gerência Superior e Procuradores</option>
                  <option value={4}>4 - Gerência Intermediária e Demais</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Abrangência da Viagem</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none bg-white"
                >
                  <option value={2}>Estadual (Dentro de Rondônia)</option>
                  <option value={0}>Nacional (Para fora do Estado)</option>
                  <option value={1}>Internacional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora de Início</label>
                <input
                  type="datetime-local"
                  value={formData.dataHoraInicio}
                  onChange={(e) => setFormData({ ...formData, dataHoraInicio: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora de Fim</label>
                <input
                  type="datetime-local"
                  value={formData.dataHoraFim}
                  onChange={(e) => setFormData({ ...formData, dataHoraFim: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Regra Especial (Descontos)</label>
                <select
                  value={formData.tipoRegra}
                  onChange={(e) => setFormData({ ...formData, tipoRegra: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none bg-white"
                >
                  <option value="Padrao">Padrão (Sem redução extra)</option>
                  <option value="CursoLongo">Curso/Evento Longo (Mais de 15 dias)</option>
                  <option value="AgenteMultiplicador">Agente Multiplicador (50%)</option>
                  <option value="JOER">Acompanhante JOER (50%)</option>
                </select>
              </div>

              {formData.tipo === 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cotação do Dólar (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cotacaoDolar || ''}
                    onChange={(e) => setFormData({ ...formData, cotacaoDolar: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none"
                    placeholder="Ex: 5.25"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Custos e Hospedagem (Travas Legais)</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hospedagemInclusa}
                    onChange={(e) => setFormData({ ...formData, hospedagemInclusa: e.target.checked })}
                    className="w-4 h-4 text-[#059669] focus:ring-[#059669] border-slate-300 rounded"
                  />
                  Inscrição do evento/curso já inclui hospedagem
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.custosTotaisTerceiros}
                    onChange={(e) => setFormData({ ...formData, custosTotaisTerceiros: e.target.checked })}
                    className="w-4 h-4 text-[#059669] focus:ring-[#059669] border-slate-300 rounded"
                  />
                  Despesas de hospedagem, alimentação e traslado totalmente custeadas por outra fonte
                </label>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-end">
              <button
                onClick={handleCalcular}
                className="bg-[#059669] hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm"
              >
                Simular Cálculo →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'statement' && resultadoCalculo && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0F2C59]">Demonstrativo de Cálculo de Diárias</h2>
                <p className="text-sm text-slate-500">Resumo detalhado dos valores a serem indenizados.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-200 space-y-2 text-sm">
              <p><strong className="text-slate-700">Servidor:</strong> {formData.servidor} (Matrícula: {formData.matricula})</p>
              <p><strong className="text-slate-700">Órgão:</strong> {formData.orgao}</p>
              <p><strong className="text-slate-700">Destino:</strong> {formData.destino}</p>
              <p>
                <strong className="text-slate-700">Abrangência Legal:</strong>{' '}
                {formData.tipo === 1 ? (
                  <span className="text-amber-600 font-semibold">Internacional (Requer aprovação do Executivo)</span>
                ) : formData.tipo === 0 ? (
                  <span className="text-amber-600 font-semibold">Nacional - Interestadual (Requer aprovação do Executivo)</span>
                ) : (
                  <span className="text-[#059669] font-semibold">Estadual (Autorização do Ordenador de Despesas)</span>
                )}
              </p>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100 text-xs text-slate-600 uppercase">
                    <th className="p-3">Descrição</th>
                    <th className="p-3 text-center">Qtd. Diárias</th>
                    <th className="p-3 text-right">Valor Base (Cálculo API)</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  <tr>
                    <td className="p-3 font-medium">Diária de Campo / Deslocamento</td>
                    <td className="p-3 text-center">{resultadoCalculo.totalDias}</td>
                    <td className="p-3 text-right">R$ {resultadoCalculo.valorUnitarioBaseBrl.toFixed(2)}</td>
                    <td className="p-3 text-right font-semibold">R$ {resultadoCalculo.valorTotalBrl.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#0F2C59] text-white p-4 rounded-lg flex justify-between items-center mb-6 shadow-sm">
              <span className="text-sm font-medium">Valor Total Autorizado:</span>
              <span className="text-2xl font-bold text-[#059669]">
                R$ {resultadoCalculo.valorTotalBrl.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('form')}
                className="text-slate-600 hover:text-slate-800 text-sm font-medium"
              >
                ← Voltar ao Formulário
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="bg-[#0F2C59] hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-md transition-colors"
              >
                Salvar e Ver Histórico
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-[#0F2C59]">Histórico de Diárias Solicitadas</h2>
              <p className="text-sm text-slate-500">Registros recentes simulados na sessão atual.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100 text-xs text-slate-600 uppercase">
                    <th className="p-3">Servidor</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3">Qtd.</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {resultadoCalculo?.elegivel && (
                    <tr>
                      <td className="p-3 font-medium">{formData.servidor}</td>
                      <td className="p-3">{formData.destino}</td>
                      <td className="p-3">{resultadoCalculo.totalDias} d</td>
                      <td className="p-3 text-right font-semibold">R$ {resultadoCalculo.valorTotalBrl.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          Simulação Recente
                        </span>
                      </td>
                    </tr>
                  )}
                  
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-start">
              <button
                onClick={() => {
                  setResultadoCalculo(null);
                  setActiveTab('form');
                }}
                className="bg-[#059669] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-700"
              >
                + Novo Cálculo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}