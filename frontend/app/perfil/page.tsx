'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Perfil() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editando = searchParams.get('editar') === 'true';

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    matricula: '',
    orgao: '',
    funcao: '',
    email: '',
    celular: ''
  });

  const [usuario, setUsuario] = useState<any>(null);
  const [salvo, setSalvo] = useState(false);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('diarias-auth');
    const dadosUsuario = localStorage.getItem('diarias-user');

    if (auth !== 'true') {
      router.replace('/login');
      return;
    }

    setAutenticado(true);

    if (dadosUsuario) {
      try {
        const u = JSON.parse(dadosUsuario);
        setUsuario(u);
        setFormData({
          nomeCompleto: u.nomeCompleto || '',
          matricula: u.matricula || '',
          orgao: u.orgao || '',
          funcao: u.funcao || '',
          email: u.email || '',
          celular: u.celular || ''
        });
      } catch {
        router.replace('/login');
      }
    }
  }, [router]);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario) {
      const usuarioAtualizado = { ...usuario, ...formData };
      localStorage.setItem('diarias-user', JSON.stringify(usuarioAtualizado));
      setSalvo(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  if (!autenticado) return null;

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 text-slate-800 font-sans">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background_login.jpg')" }}
      />
      <div className="absolute inset-0 z-0 bg-slate-900/40" />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-2xl p-8 border-t-4 border-[#0F2C59]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#0F2C59]">
            {editando ? 'Atualizar Perfil' : 'Completar Perfil'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {editando 
              ? 'Mantenha os seus dados institucionais atualizados.' 
              : 'Para utilizar o SICADI, precisamos que complete os seus dados institucionais.'}
          </p>
        </div>

        {salvo && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-md text-center">
            Perfil salvo com sucesso! Redirecionando...
          </div>
        )}

        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula (Sistema)</label>
            <input 
              type="text" 
              value={formData.matricula} 
              disabled 
              className="w-full p-2.5 border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={formData.nomeCompleto} 
              onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})} 
              required
              className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Órgão / Lotação</label>
              <input 
                type="text" 
                value={formData.orgao} 
                onChange={(e) => setFormData({...formData, orgao: e.target.value})} 
                required
                className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
              <input 
                type="text" 
                value={formData.funcao} 
                onChange={(e) => setFormData({...formData, funcao: e.target.value})} 
                required
                className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Institucional</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required
                className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Celular / WhatsApp</label>
              <input 
                type="text" 
                value={formData.celular} 
                onChange={(e) => setFormData({...formData, celular: e.target.value})} 
                required
                className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none" 
                placeholder="(69) 99999-9999"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex justify-between">
            {editando && (
              <button 
                type="button" 
                onClick={() => router.push('/')}
                className="text-slate-600 font-medium hover:text-slate-900 px-4 py-2"
              >
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              className={`bg-[#0F2C59] hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-md transition-colors w-full ${editando ? 'ml-auto max-w-[200px]' : ''}`}
            >
              Salvar Perfil
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}