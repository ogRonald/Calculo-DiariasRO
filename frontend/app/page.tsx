'use client';
import { simularCalculoDiarias, salvarHistorico, obterHistorico } from '../services/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CalculadoraDiarias() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState<{ id: string; matricula: string; orgao: string; nomeCompleto: string; funcao: string; email: string; celular: string } | null>(null);

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
          usuarioLocal.nomeCompleto?.trim() &&
          usuarioLocal.funcao?.trim() &&
          usuarioLocal.email?.trim() &&
          usuarioLocal.celular?.trim()
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
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('diarias-auth');
    localStorage.removeItem('diarias-user');
    localStorage.removeItem('diarias-user-id');
    router.replace('/login');
  };

  const [activeTab, setActiveTab] = useState<'form' | 'statement' | 'history'>('form');

  const [formData, setFormData] = useState({
    servidor: '',
    matricula: '',
    orgao: '',
    destino: '',
    categoria: 4,
    tipo: 2,
    dataHoraInicio: '',
    dataHoraFim: '',
    tipoRegra: 'Padrao',
    cotacaoDolar: '',
    hospedagemInclusa: false,
    custosTotaisTerceiros: false
  });

  useEffect(() => {
    if (usuario) {
      obterHistorico(usuario.id).then(setHistorico).catch(() => setHistorico([]));
    }
  }, [usuario]);

  const [resultadoCalculo, setResultadoCalculo] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [historicoSalvo, setHistoricoSalvo] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const handleSalvarHistorico = async () => {
    if (!usuario || !resultadoCalculo?.elegivel) return;
    try {
      const salvo = await salvarHistorico({
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
      setHistorico((atual) => [salvo, ...atual]);
      setHistoricoSalvo(true);
      setActiveTab('history');
    } catch (erro: any) { 
      setErroValidacao(erro.message || 'Não foi possível salvar no histórico.'); 
    }
  };

  const handleCalcular = async () => {
    setHistoricoSalvo(false);
    setErroValidacao(null);
    
    if (!formData.servidor || !formData.matricula || !formData.orgao) {
      setErroValidacao("Por favor, preencha o nome, matrícula e órgão do viajante.");
      return;
    }

    if (!formData.dataHoraInicio || !formData.dataHoraFim) {
      setErroValidacao("Por favor, preencha as datas de início e fim da viagem.");
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

  if (!autenticado) return null;

  return (
    <div className="relative min-h-screen text-slate-800 font-sans">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background_login.jpg')" }}
      />
      <div className="fixed inset-0 z-0 bg-slate-900/40" />

      <header className="relative z-10 bg-[#0F2C59] text-white p-4 shadow-md border-b-4 border-[#059669]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/SICADI-03.png" alt="Logo SICADI" className="h-14 w-auto object-contain" />
            </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/perfil?editar=true')} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md font-medium transition-colors">Meu perfil</button>
            <button onClick={handleLogout} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md font-medium transition-colors">Sair</button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex border-b border-slate-300 mb-6 bg-white rounded-t-lg shadow-2xl overflow-x-auto">
          <button onClick={() => setActiveTab('form')} className={`flex-1 py-3 px-4 text-sm font-medium transition-colors text-center border-b-2 whitespace-nowrap ${activeTab === 'form' ? 'border-[#059669] text-[#0F2C59] bg-slate-50 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> Formulário de Solicitante</button>
          <button onClick={() => { if (resultadoCalculo?.elegivel) setActiveTab('statement'); }} className={`flex-1 py-3 px-4 text-sm font-medium transition-colors text-center border-b-2 whitespace-nowrap ${activeTab === 'statement' ? 'border-[#059669] text-[#0F2C59] bg-slate-50 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> Demonstrativo de Diárias</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 text-sm font-medium transition-colors text-center border-b-2 whitespace-nowrap ${activeTab === 'history' ? 'border-[#059669] text-[#0F2C59] bg-slate-50 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> Histórico de Consultas</button>
        </div>

        {activeTab === 'form' && (
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-200">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-[#0F2C59]">Preencha os Dados do Cálculo</h2>
              <p className="text-sm text-slate-500">Informe os dados do servidor e os parâmetros da viagem.</p>
            </div>

            {erroValidacao && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm font-medium rounded-r-md">Atenção: {erroValidacao}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input type="text" value={formData.servidor} onChange={(e) => setFormData({ ...formData, servidor: e.target.value })} placeholder="Nome do viajante" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                <input type="text" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} placeholder="Matrícula do viajante" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Órgão / Secretaria</label>
                <input type="text" value={formData.orgao} onChange={(e) => setFormData({ ...formData, orgao: e.target.value })} placeholder="Órgão do viajante" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destino da Viagem</label>
                <input type="text" value={formData.destino} onChange={(e) => setFormData({ ...formData, destino: e.target.value })} placeholder="Cidade de destino" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria do Cargo</label>
                <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: Number(e.target.value) })} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none bg-white">
                  <option value={1}>1 - Governador e Vice</option>
                  <option value={2}>2 - Secretários e Equivalentes</option>
                  <option value={3}>3 - Gerência Superior e Procuradores</option>
                  <option value={4}>4 - Gerência Intermediária e Demais</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Abrangência da Viagem</label>
                <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: Number(e.target.value) })} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none bg-white">
                  <option value={2}>Estadual (Dentro de Rondônia)</option>
                  <option value={0}>Nacional (Para fora do Estado)</option>
                  <option value={1}>Internacional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora de Início</label>
                <input type="datetime-local" value={formData.dataHoraInicio} onChange={(e) => setFormData({ ...formData, dataHoraInicio: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora de Fim</label>
                <input type="datetime-local" value={formData.dataHoraFim} onChange={(e) => setFormData({ ...formData, dataHoraFim: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Regra Especial (Descontos)</label>
                <select value={formData.tipoRegra} onChange={(e) => setFormData({ ...formData, tipoRegra: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none bg-white">
                  <option value="Padrao">Padrão (Sem redução extra)</option>
                  <option value="CursoLongo">Curso/Evento Longo (Mais de 15 dias)</option>
                  <option value="AgenteMultiplicador">Agente Multiplicador (50%)</option>
                  <option value="JOER">Acompanhante JOER (50%)</option>
                </select>
              </div>

              {formData.tipo === 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cotação do Dólar (R$)</label>
                  <input type="number" step="0.01" value={formData.cotacaoDolar || ''} onChange={(e) => setFormData({ ...formData, cotacaoDolar: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:outline-none" placeholder="Ex: 5.25" />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Custos e Hospedagem (Travas Legais)</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.hospedagemInclusa} onChange={(e) => setFormData({ ...formData, hospedagemInclusa: e.target.checked })} className="w-4 h-4 text-[#059669] focus:ring-[#059669] border-slate-300 rounded" />
                  Inscrição do evento/curso já inclui hospedagem
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={formData.custosTotaisTerceiros} onChange={(e) => setFormData({ ...formData, custosTotaisTerceiros: e.target.checked })} className="w-4 h-4 text-[#059669] focus:ring-[#059669] border-slate-300 rounded" />
                  Despesas de hospedagem, alimentação e traslado totalmente custeadas por outra fonte
                </label>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-end">
              <button onClick={handleCalcular} className="bg-[#059669] hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm">Simular Cálculo →</button>
            </div>

            <footer className="relative z-10 flex items-center justify-center py-6 mt-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400/80">
              <span>Desenvolvido por</span>
              <img 
                src="/Quarteto Fantástico Logo-01.png" 
                alt="Logo da Equipe" 
                className="h-10" 
                />
            </div>
            </footer>
          </div>
        )}

        {activeTab === 'statement' && resultadoCalculo && (
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0F2C59]">Demonstrativo de Cálculo de Diárias</h2>
                <p className="text-sm text-slate-500">Resumo detalhado dos valores a serem indenizados.</p>
              </div>
            
            </div>

            <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-200 space-y-2 text-sm">
              <p><strong className="text-slate-700">Viajante:</strong> {formData.servidor} (Matrícula: {formData.matricula})</p>
              <p><strong className="text-slate-700">Órgão:</strong> {formData.orgao}</p>
              <p><strong className="text-slate-700">Destino:</strong> {formData.destino}</p>
              <p>
                <strong className="text-slate-700">Abrangência Legal:</strong>{' '}
                {formData.tipo === 1 ? <span className="text-amber-600 font-semibold">Internacional (Requer aprovação do Executivo)</span> : formData.tipo === 0 ? <span className="text-amber-600 font-semibold">Nacional - Interestadual (Requer aprovação do Executivo)</span> : <span className="text-[#059669] font-semibold">Estadual (Autorização do Ordenador de Despesas)</span>}
              </p>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100 text-xs text-slate-600 uppercase">
                    <th className="p-3">Descrição</th>
                    <th className="p-3 text-center">Qtd. Diárias</th>
                    <th className="p-3 text-right">Valor Base</th>
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
              <span className="text-2xl font-bold text-[#059669]">R$ {resultadoCalculo.valorTotalBrl.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setActiveTab('form')} className="text-slate-600 hover:text-slate-800 text-sm font-medium">← Voltar ao Formulário</button>
              <button onClick={handleSalvarHistorico} className="bg-[#0F2C59] hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-md transition-colors">Salvar e Ver Histórico</button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-200">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-[#0F2C59]">Histórico de Diárias Solicitadas</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100 text-xs text-slate-600 uppercase">
                    <th className="p-3">Viajante</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3">Qtd.</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {historico.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{item.nomeBeneficiario || usuario?.nomeCompleto}</td>
                      <td className="p-3 text-slate-600">{item.destino}</td>
                      <td className="p-3 text-slate-600">{item.totalDias} d</td>
                      <td className="p-3 text-right font-semibold text-slate-700">R$ {Number(item.valorTotalBrl).toFixed(2)}</td>
                      <td className="p-3 text-center flex justify-center items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-md font-medium">
                          Salvo
                        </span>
                        
                        <button
                          onClick={() => window.open(`http://localhost:5211/api/v1/relatorio/${item.id}`, '_blank')}
                          className="bg-[#0F2C59] hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors shadow-sm flex items-center gap-1.5"
                          title="Baixar Documento Oficial"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        Nenhum cálculo salvo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-start">
              <button 
                onClick={() => { setResultadoCalculo(null); setActiveTab('form'); }} 
                className="bg-[#059669] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-700"
              >
                + Novo Cálculo
              </button>
            </div>

              <footer className="relative z-10 flex items-center justify-center py-6 mt-auto">
              <div className="flex items-center gap-2 text-xs text-slate-400/80">
              <span>Desenvolvido por</span>
              <img 
                src="/Quarteto Fantástico Logo-01.png" 
                alt="Logo da Equipe" 
                className="h-10" 
                />
            </div>
            </footer>



          </div>
        )}
      </main>
    </div>
  );
}