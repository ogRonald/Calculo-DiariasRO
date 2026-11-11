'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

function SidebarNavegacao() {
  const pathname = usePathname();

  // Oculta a barra lateral na tela de login
  if (pathname === '/login') {
    return null;
  }

  const isSimulacao = pathname === '/';
  const isDemonstrativo = pathname.startsWith('/demonstrativo');
  const isHistorico = pathname.startsWith('/historico');
  const isGestao = pathname.startsWith('/gestao');
  const isPerfil = pathname.startsWith('/perfil');

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col border-r border-slate-800 flex-shrink-0">
      
      <div className="p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl flex-shrink-0">
            $
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none">SICADI</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-tight uppercase tracking-wider">
              Sistema de Cálculo<br />de Diárias
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-8">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 mb-3 px-3 uppercase tracking-wider">Menu Principal</h2>
          <nav className="flex flex-col gap-1">
            <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isSimulacao ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`w-4 h-4 rounded-sm ${isSimulacao ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
              Nova simulação
            </Link>
            <Link href="/demonstrativo" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDemonstrativo ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`w-4 h-4 rounded-sm ${isDemonstrativo ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
              Demonstrativo
            </Link>
            <Link href="/historico" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isHistorico ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`w-4 h-4 rounded-sm ${isHistorico ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
              Histórico
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-500 mb-3 px-3 uppercase tracking-wider">Área do Gestor</h2>
          <nav className="flex flex-col gap-1">
            <Link href="/gestao" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isGestao ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`w-4 h-4 rounded-sm ${isGestao ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
              Solicitações
            </Link>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <h2 className="text-xs font-semibold text-slate-500 mb-3 px-3 uppercase tracking-wider">Conta</h2>
        <nav className="flex flex-col gap-1 mb-4">
          <Link href="/perfil" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isPerfil ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <div className={`w-4 h-4 rounded-sm ${isPerfil ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
            Meu perfil
          </Link>
          <button onClick={() => {
            localStorage.removeItem('diarias-auth');
            localStorage.removeItem('diarias-user');
            window.location.href = '/login';
          }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full text-left">
            <div className="w-4 h-4 rounded-sm bg-slate-700"></div>
            Sair
          </button>
        </nav>
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <p className="text-[10px] font-semibold text-slate-300">SICADI • Projeto acadêmico</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Rondônia • Protótipo visual</p>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  // Não renderiza nem o fallback do Suspense se for a rota /login
  if (pathname === '/login') {
    return null;
  }

  return (
    <Suspense fallback={<aside className="w-64 min-h-screen bg-slate-900 flex-shrink-0"></aside>}>
      <SidebarNavegacao />
    </Suspense>
  );
}