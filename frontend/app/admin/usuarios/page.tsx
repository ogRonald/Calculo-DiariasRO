'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDiarias } from '../../../contexts/DiariasContext';
import { listarUsuariosAdmin, alterarNivelAcessoUsuario } from '../../../services/api';

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { usuario, setUsuario } = useDiarias() as any;

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'TODOS' | 'Operador' | 'Gestor' | 'Admin'>('TODOS');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

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

  const handleAlterarPermissao = async (idUsuario: string, novoNivel: string, nomeExibicao: string) => {
    setFeedback(null);
    setAtualizandoId(idUsuario);

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
      setAtualizandoId(null);
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
            Gerencie os perfis de acesso dos servidores cadastrados no SICADI (Operador, Gestor ou Administrador).
          </p>
        </div>
        <button
          onClick={carregarListaUsuarios}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-xs whitespace-nowrap"
        >
          Atualizar Lista
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Cadastrado</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{contadores.total}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-purple-600 uppercase">Administradores</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{contadores.admins}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Gestores</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{contadores.gestores}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Operadores</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{contadores.operadores}</p>
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
                <th className="p-4 px-6">Contato</th>
                <th className="p-4 px-6 text-center">Perfil Atual</th>
                <th className="p-4 px-6 text-right">Alterar Permissão</th>
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
                  const email = u.email ?? u.Email ?? '—';
                  const celular = u.celular ?? u.Celular ?? '';
                  const nivel = u.nivelAcesso ?? u.NivelAcesso ?? 'Operador';
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
                        <p className="text-xs text-slate-400">Matrícula: {matricula}</p>
                      </td>

                      <td className="p-4 px-6">
                        <p className="font-medium text-slate-800">{orgao}</p>
                        {funcao && <p className="text-xs text-slate-500">{funcao}</p>}
                      </td>

                      <td className="p-4 px-6 text-xs text-slate-600">
                        <p>{email}</p>
                        {celular && <p className="text-slate-400 mt-0.5">{celular}</p>}
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
                        <select
                          value={nivel}
                          disabled={atualizandoId === idU}
                          onChange={(e) =>
                            handleAlterarPermissao(idU, e.target.value, nome || matricula)
                          }
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                          <option value="Operador">Operador</option>
                          <option value="Gestor">Gestor</option>
                          <option value="Admin">Admin</option>
                        </select>
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