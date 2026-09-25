'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { atualizarPerfil, obterPerfil } from '../../services/api';

function perfilCompleto(usuario: any) {
  return Boolean(
    usuario?.nomeCompleto?.trim() &&
    usuario?.funcao?.trim() &&
    usuario?.email?.trim() &&
    usuario?.celular?.trim()
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modoEdicao = searchParams.get('editar') === 'true';

  const [usuarioId, setUsuarioId] = useState('');
  const [matricula, setMatricula] = useState('');
  const [orgao, setOrgao] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [funcao, setFuncao] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('diarias-auth');
    const id = localStorage.getItem('diarias-user-id');

    if (auth !== 'true' || !id) {
      router.replace('/login');
      return;
    }

    setUsuarioId(id);
    obterPerfil(id)
      .then((usuario) => {
        setMatricula(usuario.matricula);
        setOrgao(usuario.orgao);
        setNomeCompleto(usuario.nomeCompleto || '');
        setFuncao(usuario.funcao || '');
        setEmail(usuario.email || '');
        setCelular(usuario.celular || '');
        localStorage.setItem('diarias-user', JSON.stringify(usuario));

        // O perfil completo só pode ser aberto pelo fluxo de edição explícito.
        // Isso evita que a tela apareça novamente a cada login.
        if (perfilCompleto(usuario) && !modoEdicao) {
          router.replace('/');
        }
      })
      .catch((error: any) => setErro(error.message || 'Não foi possível carregar o perfil.'))
      .finally(() => setCarregando(false));
  }, [router, modoEdicao]);

  const handleSalvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');

    if (!nomeCompleto.trim() || !funcao.trim() || !email.trim() || !celular.trim()) {
      setErro('Preencha todos os campos do perfil antes de continuar.');
      return;
    }

    if (modoEdicao && !senha) {
      setErro('Informe sua senha atual para alterar os dados do perfil.');
      return;
    }

    try {
      setSalvando(true);
      const usuario = await atualizarPerfil(usuarioId, {
        nomeCompleto: nomeCompleto.trim(),
        funcao: funcao.trim(),
        email: email.trim(),
        celular: celular.trim(),
        ...(modoEdicao ? { senha } : {}),
      });

      localStorage.setItem('diarias-user', JSON.stringify(usuario));
      setSenha('');
      router.replace('/');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível salvar os dados.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('diarias-auth');
    localStorage.removeItem('diarias-user');
    localStorage.removeItem('diarias-user-id');
    router.replace('/login');
  };

  if (carregando) return null;

  return (
    // Adicionado o "relative" no <main> e removido o bg-slate-100
    <main className="relative min-h-screen text-slate-800 font-sans flex items-center justify-center p-4">
      
      {/* Imagem de Fundo */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background_login.jpg')" }}
      />
      
      {/* Overlay escuro para dar contraste ao formulário */}
      <div className="absolute inset-0 z-0 bg-slate-900/60" />

      {/* Adicionado o "relative z-10" para trazer o formulário para frente */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Alterado shadow-md para shadow-2xl para manter a consistência visual */}
        <div className="bg-[#0F2C59] text-white rounded-t-xl p-6 shadow-2xl border-b-4 border-[#059669]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/SICADI-03.png" alt="Logo SICADI" className="h-14 w-auto object-contain" />
            </div>
            <button onClick={handleLogout} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md font-medium transition-colors">Sair</button>
          </div>
        </div>

        {/* Alterado shadow-sm para shadow-2xl */}
        <form onSubmit={handleSalvar} className="bg-white rounded-b-xl shadow-2xl border border-slate-200 border-t-0 p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-[#0F2C59]">Informações do Perfil</h2>
            <p className="text-sm text-slate-500 mt-1">
              {modoEdicao
                ? 'Atualize seus dados. Por segurança, sua senha atual será solicitada para confirmar a alteração.'
                : 'Complete todos os dados para continuar.'}
            </p>
          </div>

          {erro && <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm font-medium rounded-r-md">{erro}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
              <input value={matricula} readOnly className="w-full p-2.5 border border-slate-300 rounded-md bg-slate-50 text-slate-600 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Órgão / Instituição</label>
              <input value={orgao} readOnly className="w-full p-2.5 border border-slate-300 rounded-md bg-slate-50 text-slate-600 focus:outline-none" />
            </div>

            <div>
              <label htmlFor="nomeCompleto" className="block text-sm font-medium text-slate-700 mb-1">Nome Completo <span className="text-red-600">*</span></label>
              <input id="nomeCompleto" required value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} placeholder="Digite seu nome completo" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
            </div>

            <div>
              <label htmlFor="funcao" className="block text-sm font-medium text-slate-700 mb-1">Função / Cargo <span className="text-red-600">*</span></label>
              <input id="funcao" required value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Digite sua função ou cargo" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail <span className="text-red-600">*</span></label>
              <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@orgao.gov.br" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
            </div>

            <div>
              <label htmlFor="celular" className="block text-sm font-medium text-slate-700 mb-1">Celular <span className="text-red-600">*</span></label>
              <input id="celular" required type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="(69) 99999-9999" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
            </div>
          </div>

          {modoEdicao && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <label htmlFor="senhaAtual" className="block text-sm font-medium text-slate-700 mb-1">Senha atual <span className="text-red-600">*</span></label>
              <input id="senhaAtual" required type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha para confirmar a alteração" autoComplete="current-password" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
              <p className="text-xs text-slate-500 mt-1.5">A senha é usada apenas para confirmar a alteração e não será exibida ou armazenada nesta tela.</p>
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:justify-end">
            {modoEdicao && (
              <button type="button" onClick={() => router.push('/')} className="px-6 py-2.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors">Cancelar</button>
            )}
            <button type="submit" disabled={salvando} className="px-6 py-2.5 rounded-md bg-[#059669] hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium transition-colors shadow-sm">{salvando ? 'Salvando...' : (modoEdicao ? 'Salvar alterações' : 'Salvar e continuar')}</button>
          </div>
        </form>
      
                   
      
      </div>
    </main>
  );
}