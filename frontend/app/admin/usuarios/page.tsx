'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDiarias } from '../../../contexts/DiariasContext';
import {
  listarUsuariosAdmin,
  criarUsuarioAdmin,
  alterarNivelAcessoUsuario,
  resetarSenhaUsuarioAdmin,
} from '../../../services/api';

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { usuario, setUsuario } = useDiarias() as any;

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'TODOS' | 'Operador' | 'Gestor' | 'Admin'>('TODOS');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Modal de criação de usuário
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [novoForm, setNovoForm] = useState({
    matricula: '',
    nomeCompleto: '',
    orgao: '',
    funcao: '',
    email: '',
    celular: '',
    nivelAcesso: 'Operador',
  });

  useEffect(() => {
    const dadosUsuario = localStorage.getItem('diarias-user');
    let user = usuario;

    if (dadosUsuario) {
      try {
        const parsed = JSON.parse(dadosUsuario);
        user = parsed;
        setUsuarioLogado(parsed);
        if (!usuario) setUsuario(parsed);
      } catch {
        user = null;
      }
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    const nivelAtual = String(user.nivelAcesso ?? user.NivelAcesso ?? user.role ?? user.Role ?? '').toLowerCase();
    // Bloqueia qualquer perfil que não seja estritamente Admin (inclusive Gestor)
    if (nivelAtual !== 'admin') {
      router.replace('/');
      return;
    }

    carregarListaUsuarios();
  }, [usuario, setUsuario, router]);

  const carregarListaUsuarios = async () => {
    setCarregando(true);
    try {
      const lista = await listarUsuariosAdmin();
      setUsuarios(lista || []);
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.message || 'Erro ao carregar a lista de usuários.',
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setCriandoUsuario(true);

    try {
      const resp = await criarUsuarioAdmin(novoForm);
      if (resp.usuario) {
        setUsuarios((prev) => [resp.usuario, ...prev]);
      } else {
        await carregarListaUsuarios();
      }

      setFeedback({
        tipo: 'sucesso',
        texto: `Usuário "${novoForm.nomeCompleto}" (Mat: ${novoForm.matricula}) criado com senha temporária SICADI@2026.`,
      });

      setNovoForm({
        matricula: '',
        nomeCompleto: '',
        orgao: '',
        funcao: '',
        email: '',
        celular: '',
        nivelAcesso: 'Operador',
      });
      setModalNovoAberto(false);
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.message || 'Erro ao cadastrar o usuário.',
      });
    } finally {
      setCriandoUsuario(false);
    }
  };

  const handleAlterarPermissao = async (idUsuario: string, novoNivel: string, nomeExibicao: string) => {
    setFeedback(null);
    setProcessandoId(idUsuario);

    try {
      await alterarNivelAcessoUsuario(idUsuario, novoNivel);

      setUsuarios((prev) =>
        prev.map((u) =>
          (u.id ?? u.Id) === idUsuario
            ? { ...u, nivelAcesso: novoNivel, NivelAcesso: novoNivel }
            : u
        )
      );

      setFeedback({
        tipo: 'sucesso',
        texto: `Permissão de "${nomeExibicao}" alterada para ${novoNivel} com sucesso.`,
      });
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.message || 'Não foi possível alterar o nível de acesso.',
      });
    } finally {
      setProcessandoId(null);
    }
  };

  const handleResetarSenha = async (idUsuario: string, nomeExibicao: string, matricula: string) => {
    const confirmar = window.confirm(
      `Deseja resetar a senha de "${nomeExibicao}" (Matrícula: ${matricula}) para "SICADI@2026"?\n\nNo próximo login, o usuário será obrigado a cadastrar uma nova senha.`
    );
    if (!confirmar) return;

    setFeedback(null);
    setProcessandoId(idUsuario);

    try {
      const resp = await resetarSenhaUsuarioAdmin(idUsuario);
      setUsuarios((prev) =>
        prev.map((u) =>
          (u.id ?? u.Id) === idUsuario
            ? { ...u, deveTrocarSenha: true, DeveTrocarSenha: true }
            : u
        )
      );

      setFeedback({
        tipo: 'sucesso',
        texto: resp.mensagem || `Senha de ${matricula} redefinida para SICADI@2026.`,
      });
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.message || 'Erro ao resetar a senha.',
      });
    } finally {
      setProcessandoId(null);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const nivel = u.nivelAcesso ?? u.NivelAcesso ?? 'Operador';
      if (filtroNivel !== 'TODOS' && nivel !== filtroNivel) return false;

      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const nome = String(u.nomeCompleto ?? u.NomeCompleto ?? '').toLowerCase();
        const matricula = String(u.matricula ?? u.Matricula ?? '').toLowerCase();
        const orgao = String(u.orgao ?? u.Orgao ?? '').toLowerCase();
        const email = String(u.email ?? u.Email ?? '').toLowerCase();

        return (
          nome.includes(termo) ||
          matricula.includes(termo) ||
          orgao.includes(termo) ||
          email.includes(termo)
        );
      }

      return true;
    });
  }, [usuarios, busca, filtroNivel]);

  const contadores = useMemo(() => {
    return {
      total: usuarios.length,
      admins: usuarios.filter((u) => (u.nivelAcesso ?? u.NivelAcesso) === 'Admin').length,
      gestores: usuarios.filter((u) => (u.nivelAcesso ?? u.NivelAcesso) === 'Gestor').length,
      operadores: usuarios.filter((u) => (u.nivelAcesso ?? u.NivelAcesso ?? 'Operador') === 'Operador').length,
    };
  }, [usuarios]);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full text-slate-800 font-sans">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Usuários e Permissões</h1>
          <p className="text-slate-500 text-sm">
            Cadastre servidores, defina perfis de acesso e gerencie redefinições de senha.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={carregarListaUsuarios}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-xs"
          >
            Atualizar
          </button>
          <button
            onClick={() => setModalNovoAberto(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm shadow-xs"
          >
            + Novo Usuário
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Cadastrado</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{contadores.total}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-purple-600 uppercase">Administradores</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{contadores.admins}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Gestores</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{contadores.gestores}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Operadores</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{contadores.operadores}</p>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-medium border flex items-center justify-between gap-3 ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.texto}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, matrícula, órgão ou e-mail..."
          className="w-full md:w-96 p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {(['TODOS', 'Operador', 'Gestor', 'Admin'] as const).map((nivel) => (
            <button
              key={nivel}
              onClick={() => setFiltroNivel(nivel)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                filtroNivel === nivel
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {nivel === 'TODOS' ? 'Todos' : nivel}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                <th className="p-4 px-6">Servidor</th>
                <th className="p-4 px-6">Órgão / Cargo</th>
                <th className="p-4 px-6">Status Senha</th>
                <th className="p-4 px-6 text-center">Perfil Atual</th>
                <th className="p-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {carregando ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Carregando servidores cadastrados...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const idU = u.id ?? u.Id;
                  const nome = u.nomeCompleto ?? u.NomeCompleto;
                  const matricula = u.matricula ?? u.Matricula ?? '—';
                  const orgao = u.orgao ?? u.Orgao ?? '—';
                  const funcao = u.funcao ?? u.Funcao ?? '';
                  const email = u.email ?? u.Email ?? '';
                  const nivel = u.nivelAcesso ?? u.NivelAcesso ?? 'Operador';
                  const trocaPendente = Boolean(u.deveTrocarSenha ?? u.DeveTrocarSenha);
                  const ehProprioUsuario = idU === (usuarioLogado?.id ?? usuarioLogado?.Id);

                  return (
                    <tr key={idU} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 px-6">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {nome || 'Cadastro incompleto'}
                          </p>
                          {ehProprioUsuario && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              Você
                            </span>
                          )}
                        </div>
                                     <p className="text-xs text-slate-600">
                          Mat: {matricula} {email ? `• ${email}` : ''}
                        </p>
                      </td>

                      <td className="p-4 px-6">
                        <p className="font-medium text-slate-800">{orgao}</p>
                              {funcao && <p className="text-xs text-slate-600">{funcao}</p>}
                      </td>

                      <td className="p-4 px-6 whitespace-nowrap">
                        {trocaPendente ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Troca pendente (SICADI@2026)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                            Senha ativa
                          </span>
                        )}
                      </td>

                      <td className="p-4 px-6 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            nivel === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : nivel === 'Gestor'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              nivel === 'Admin'
                                ? 'bg-purple-600'
                                : nivel === 'Gestor'
                                ? 'bg-emerald-500'
                                : 'bg-slate-500'
                            }`}
                          ></span>
                          {nivel}
                        </span>
                      </td>

                      <td className="p-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={nivel}
                            disabled={processandoId === idU}
                            onChange={(e) =>
                              handleAlterarPermissao(idU, e.target.value, nome || matricula)
                            }
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                          >
                            <option value="Operador">Operador</option>
                            <option value="Gestor">Gestor</option>
                            <option value="Admin">Admin</option>
                          </select>

                          <button
                            type="button"
                            disabled={processandoId === idU || ehProprioUsuario}
                            onClick={() => handleResetarSenha(idU, nome || matricula, matricula)}
                            title={
                              ehProprioUsuario
                                ? 'Altere sua própria senha na tela Meu Perfil'
                                : 'Redefinir senha para SICADI@2026'
                            }
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                          >
                            Resetar Senha
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

      {/* Modal de Cadastro de Novo Usuário */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cadastrar Novo Usuário</h2>
                <p className="text-xs text-slate-500">
                  Senha inicial padrão: <strong className="text-slate-700">SICADI@2026</strong> (troca obrigatória no 1º acesso)
                </p>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Matrícula *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoForm.matricula}
                    onChange={(e) => setNovoForm({ ...novoForm, matricula: e.target.value })}
                    placeholder="Ex: 0000123"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Perfil de Acesso *
                  </label>
                  <select
                    value={novoForm.nivelAcesso}
                    onChange={(e) => setNovoForm({ ...novoForm, nivelAcesso: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Operador">Operador</option>
                    <option value="Gestor">Gestor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={novoForm.nomeCompleto}
                  onChange={(e) => setNovoForm({ ...novoForm, nomeCompleto: e.target.value })}
                  placeholder="Nome completo do servidor"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Órgão / Instituição *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoForm.orgao}
                    onChange={(e) => setNovoForm({ ...novoForm, orgao: e.target.value })}
                    placeholder="Ex: IPERON, SEFIN, SESAU..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={novoForm.funcao}
                    onChange={(e) => setNovoForm({ ...novoForm, funcao: e.target.value })}
                    placeholder="Ex: Analista Administrativo"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={novoForm.email}
                    onChange={(e) => setNovoForm({ ...novoForm, email: e.target.value })}
                    placeholder="servidor@orgao.ro.gov.br"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Celular
                  </label>
                  <input
                    type="text"
                    value={novoForm.celular}
                    onChange={(e) => setNovoForm({ ...novoForm, celular: e.target.value })}
                    placeholder="(69) 99999-9999"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criandoUsuario}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {criandoUsuario ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}