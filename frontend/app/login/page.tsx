'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fazerLogin } from '../../services/api';

const ORGAOS = [
  'Governadoria do Estado',
  'Secretaria de Estado da Educação - SEDUC',
  'Secretaria de Estado da Saúde - SESAU',
  'Secretaria de Estado de Finanças - SEFIN',
  'Secretaria de Estado de Administração - SEAD',
  'Procuradoria-Geral',
  'Autarquia',
  'Outro órgão / instituição'
];

export default function LoginPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [orgao, setOrgao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('diarias-auth') === 'true') {
      router.replace('/perfil');
    }
  }, [router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');

    if (!matricula.trim() || !senha || !orgao) {
      setErro('Preencha a matrícula, a senha e o órgão/instituição.');
      return;
    }

    try {
      setCarregando(true);
      const usuario = await fazerLogin({ matricula: matricula.trim(), senha, orgao });

      localStorage.setItem('diarias-auth', 'true');
      localStorage.setItem('diarias-user-id', usuario.id);
      localStorage.setItem('diarias-user', JSON.stringify(usuario));
      const perfilCompleto = Boolean(
        usuario.nomeCompleto?.trim() &&
        usuario.funcao?.trim() &&
        usuario.email?.trim() &&
        usuario.celular?.trim()
      );
      router.push(perfilCompleto ? '/' : '/perfil');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível realizar o login.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="relative min-h-screen text-slate-800 font-sans flex items-center justify-center p-4">
      {/* Imagem de Fundo */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background_login.jpg')" }}
      />
      
      {/* Overlay escuro para dar contraste ao formulário */}
      <div className="absolute inset-0 z-0 bg-slate-900/60" />

      {/* Container do formulário com z-index para ficar acima do fundo */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0F2C59] text-white rounded-t-xl p-6 shadow-2xl border-b-4 border-[#059669]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#059669] rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-sm">RO</div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl leading-tight">Governo do Estado de Rondônia</h1>
              <p className="text-xs text-slate-300 mt-1">Sistema de Calculadora de Diárias de Viagem</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-b-xl shadow-2xl border border-slate-200 border-t-0 p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-[#0F2C59]">Acesso ao Sistema</h2>
            <p className="text-sm text-slate-500 mt-1">Informe seus dados para acessar o sistema de cálculo de diárias.</p>
          </div>

          {erro && <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm font-medium rounded-r-md">{erro}</div>}

          <div className="space-y-4">
            <div>
              <label htmlFor="matricula" className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
              <input id="matricula" type="text" value={matricula} onChange={(event) => setMatricula(event.target.value)} placeholder="Digite sua matrícula" autoComplete="username" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input id="senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Digite sua senha" autoComplete="current-password" className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none" />
            </div>

            <div>
              <label htmlFor="orgao" className="block text-sm font-medium text-slate-700 mb-1">Órgão / Instituição</label>
              <select id="orgao" value={orgao} onChange={(event) => setOrgao(event.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:outline-none bg-white">
                <option value="">Selecione o órgão / instituição</option>
                {ORGAOS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={carregando} className="w-full mt-7 bg-[#059669] hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm">
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          
        </form>
      </div>
    </main>
  );
}