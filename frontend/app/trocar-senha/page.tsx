'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trocarSenhaObrigatoria } from '../../services/api';

export default function TrocarSenhaObrigatoriaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('diarias-user');
    if (!raw) {
      router.replace('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (novaSenha.trim().length < 6) {
      setErro('A nova senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha.trim() === 'SICADI@2026') {
      setErro('Escolha uma senha diferente da senha temporária padrão.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação de senha não confere.');
      return;
    }

    setSalvando(true);
    try {
      await trocarSenhaObrigatoria(novaSenha.trim());

      const raw = localStorage.getItem('diarias-user');
      if (raw) {
        const user = JSON.parse(raw);
        user.deveTrocarSenha = false;
        user.DeveTrocarSenha = false;
        localStorage.setItem('diarias-user', JSON.stringify(user));
      }

      router.replace('/');
    } catch (err: any) {
      setErro(err.message || 'Não foi possível atualizar a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200">
        <div className="mb-6">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Ação Obrigatória
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Defina sua Nova Senha</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sua senha foi redefinida pelo administrador para o padrão temporário. Para continuar usando o SICADI, cadastre uma nova senha pessoal.
          </p>
        </div>

        {erro && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-lg mb-4">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando nova senha...' : 'Salvar Nova Senha e Acessar'}
          </button>
        </form>
      </div>
    </div>
  );
}