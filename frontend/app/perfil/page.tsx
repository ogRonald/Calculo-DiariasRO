'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { obterPerfil, atualizarPerfil } from '../../services/api';
import { useDiarias } from '../../contexts/DiariasContext';

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUsuario: setUsuarioContext } = useDiarias() as any;

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    matricula: '',
    orgao: '',
    funcao: '',
    email: '',
    celular: '',
    novaSenha: '',
    confirmarNovaSenha: ''
  });

  const [usuario, setUsuario] = useState<any>(null);
  const [modoOnboarding, setModoOnboarding] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para o Modal de Confirmação de Senha Atual
  const [showModal, setShowModal] = useState(false);
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('diarias-auth');
    const dadosUsuario = localStorage.getItem('diarias-user');
    const paramEditar = searchParams.get('editar') === 'true';

    if (auth !== 'true' || !dadosUsuario) {
      router.replace('/login');
      return;
    }

    setAutenticado(true);

    async function inicializarPerfil() {
      try {
        const u = JSON.parse(dadosUsuario!);
        setUsuario(u);

        const perfilIncompleto = !u.funcao || !u.email || !u.celular;
        setModoOnboarding(!paramEditar && perfilIncompleto);

        setFormData((prev) => ({
          ...prev,
          nomeCompleto: u.nomeCompleto || '',
          matricula: u.matricula || '',
          orgao: u.orgao || '',
          funcao: u.funcao || '',
          email: u.email || '',
          celular: u.celular || ''
        }));

        if (u.id) {
          const perfilApi = await obterPerfil(u.id);
          if (perfilApi) {
            const dadosAtualizados = {
              nomeCompleto: perfilApi.nomeCompleto ?? u.nomeCompleto ?? '',
              matricula: perfilApi.matricula ?? u.matricula ?? '',
              orgao: perfilApi.orgao ?? u.orgao ?? '',
              funcao: perfilApi.funcao ?? u.funcao ?? '',
              email: perfilApi.email ?? u.email ?? '',
              celular: perfilApi.celular ?? u.celular ?? ''
            };
            setFormData((prev) => ({ ...prev, ...dadosAtualizados }));
            setUsuario((prev: any) => ({ ...prev, ...dadosAtualizados }));
          }
        }
      } catch {
        // Mantém os dados do cache local caso a consulta falhe
      } finally {
        setCarregandoDados(false);
      }
    }

    inicializarPerfil();
  }, [router, searchParams]);

  const handleAbrirModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    // Valida os campos de nova senha apenas se o usuário preencheu algum deles
    if (formData.novaSenha || formData.confirmarNovaSenha) {
      if (formData.novaSenha.trim().length < 6) {
        setErro('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (formData.novaSenha !== formData.confirmarNovaSenha) {
        setErro('A nova senha e a confirmação não conferem.');
        return;
      }
      if (formData.novaSenha.trim() === 'SICADI@2026') {
        setErro('Escolha uma nova senha diferente da senha temporária padrão.');
        return;
      }
    }

    setSenhaConfirmacao('');
    setShowModal(true);
  };

  const confirmarSalvamento = async () => {
    if (!senhaConfirmacao) {
      setErro('A senha atual é obrigatória para confirmar as alterações.');
      setShowModal(false);
      return;
    }

    if (!usuario) return;

    setIsLoading(true);
    setErro('');
    try {
      const alterouSenha = Boolean(formData.novaSenha.trim());

      await atualizarPerfil(usuario.id, {
        nomeCompleto: formData.nomeCompleto.trim(),
        orgao: formData.orgao.trim(),
        funcao: formData.funcao.trim(),
        email: formData.email.trim(),
        celular: formData.celular.trim(),
        senha: senhaConfirmacao,
        ...(alterouSenha ? { novaSenha: formData.novaSenha.trim() } : {})
      });

      const usuarioAtualizado = {
        ...usuario,
        nomeCompleto: formData.nomeCompleto.trim(),
        orgao: formData.orgao.trim(),
        funcao: formData.funcao.trim(),
        email: formData.email.trim(),
        celular: formData.celular.trim()
      };

      localStorage.setItem('diarias-user', JSON.stringify(usuarioAtualizado));
      setUsuario(usuarioAtualizado);
      if (typeof setUsuarioContext === 'function') {
        setUsuarioContext(usuarioAtualizado);
      }

      // Limpa os campos de nova senha após salvar com sucesso
      setFormData((prev) => ({
        ...prev,
        novaSenha: '',
        confirmarNovaSenha: ''
      }));

      setMensagemSucesso(
        modoOnboarding
          ? 'Perfil salvo com sucesso! Redirecionando...'
          : alterouSenha
          ? 'Dados cadastrais e senha atualizados com sucesso!'
          : 'Dados cadastrais atualizados com sucesso!'
      );
      setShowModal(false);
      setSenhaConfirmacao('');

      if (modoOnboarding) {
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar. Verifique se a sua senha atual está correta.');
      setShowModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!autenticado) return null;

  return (
        <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 text-slate-800 font-sans bg-slate-50">

      {/* MODAL DE CONFIRMAÇÃO DE SENHA ATUAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border-t-4 border-[#0F2C59]">
            <h3 className="text-lg font-bold text-[#0F2C59] mb-1.5">Confirmar Identidade</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Por questões de segurança, insira a sua <strong>senha atual</strong> para autorizar {formData.novaSenha ? 'a alteração dos dados e da senha.' : 'a atualização dos dados.'}
            </p>

            <input
              type="password"
              value={senhaConfirmacao}
              onChange={(e) => setSenhaConfirmacao(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && senhaConfirmacao && !isLoading) {
                  e.preventDefault();
                  confirmarSalvamento();
                }
              }}
              className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none mb-5"
              placeholder="Digite sua senha atual..."
              autoFocus
            />

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSalvamento}
                disabled={isLoading || !senhaConfirmacao}
                className="px-4 py-2 text-xs font-semibold bg-[#0F2C59] text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Validando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-[#0F2C59] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-[#0F2C59]">
              {modoOnboarding ? 'Completar Perfil' : 'Meu Perfil'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {modoOnboarding
                ? 'Para utilizar o SICADI, complete os seus dados institucionais.'
                : 'Mantenha os seus dados funcionais, de contato e senha atualizados.'}
            </p>
          </div>
          {(usuario?.nivelAcesso || usuario?.role) && (
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {usuario.nivelAcesso || usuario.role}
            </span>
          )}
        </div>

        {erro && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium rounded-lg text-center">
            {erro}
          </div>
        )}

        {mensagemSucesso && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium rounded-lg text-center">
            {mensagemSucesso}
          </div>
        )}

        {carregandoDados ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Carregando informações cadastrais...
          </div>
        ) : (
          <form onSubmit={handleAbrirModal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Matrícula (Sistema)
                </label>
                <input
                  type="text"
                  value={formData.matricula}
                  disabled
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Órgão / Lotação
                </label>
                <input
                  type="text"
                  value={formData.orgao}
                  onChange={(e) => setFormData({ ...formData, orgao: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Cargo / Função
              </label>
              <input
                type="text"
                value={formData.funcao}
                onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  E-mail Institucional
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Celular / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  required
                  placeholder="(69) 99999-9999"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                />
              </div>
            </div>

            {/* Seção Opcional de Troca de Senha */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="mb-3">
                <h2 className="text-xs font-bold text-[#0F2C59] uppercase tracking-wider">
                  Alterar Senha de Acesso 
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deixe em branco caso queira manter a sua senha atual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={formData.novaSenha}
                    onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={formData.confirmarNovaSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarNovaSenha: e.target.value })}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              {!modoOnboarding && (
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  disabled={isLoading}
                  className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  &larr; Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-[#0F2C59] hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-xs ${
                  modoOnboarding ? 'w-full' : 'ml-auto'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                Salvar Perfil
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function Perfil() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Carregando perfil...
        </div>
      }
    >
      <PerfilContent />
    </Suspense>
  );
}