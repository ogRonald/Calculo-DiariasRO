'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Importação corrigida com o nome da função que realmente existe no seu api.ts
import { fazerLogin } from '../../services/api';

export default function Login() {
  const router = useRouter();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [orgao, setOrgao] = useState(''); // Adicionado o campo Órgão exigido pela sua API
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      // Chama a função fazerLogin que existe no seu api.ts
      const payloadLogin = {
        matricula: matricula,
        senha: senha,
        orgao: orgao
      };

      const apiUsuario = await fazerLogin(payloadLogin);
      
      if (!apiUsuario) {
        setErro('Matrícula não encontrada na base de dados.');
        return;
      }
      
      // Se a API retornar sucesso e um usuário válido
      localStorage.setItem('diarias-auth', 'true');
      localStorage.setItem('diarias-user-id', apiUsuario.id);
      
      const perfilLocalStorage = {
        id: apiUsuario.id,
        matricula: apiUsuario.matricula,
        nomeCompleto: apiUsuario.nomeCompleto || '',
        orgao: apiUsuario.orgao || '',
        funcao: apiUsuario.funcao || '',
        email: apiUsuario.email || '',
        celular: apiUsuario.celular || ''
      };
      
      localStorage.setItem('diarias-user', JSON.stringify(perfilLocalStorage));
      
      const perfilCompleto = Boolean(
        perfilLocalStorage.nomeCompleto.trim() &&
        perfilLocalStorage.funcao.trim() &&
        perfilLocalStorage.email.trim() &&
        perfilLocalStorage.celular.trim()
      );

      if (perfilCompleto) {
        router.push('/');
      } else {
        router.push('/perfil');
      }
    } catch (err: any) {
      setErro(err.message || 'Credenciais inválidas ou falha na comunicação.');
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 text-slate-800 font-sans">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background_login.jpg')" }}
      />
      <div className="absolute inset-0 z-0 bg-slate-900/40" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-2xl p-8 border-t-4 border-[#0F2C59]">
        
        <div className="flex justify-center mb-6">
          <img src="/logo-sicadi.png" alt="Logo SICADI" className="h-24 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0F2C59] mb-1">Acesso Restrito</h2>
          <p className="text-sm text-slate-500">Insira a sua matrícula, senha e órgão para aceder ao sistema.</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
            <input 
              type="text" 
              value={matricula} 
              onChange={(e) => setMatricula(e.target.value)} 
              placeholder="Ex: 000001"
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Órgão</label>
            <input 
              type="text" 
              value={orgao} 
              onChange={(e) => setOrgao(e.target.value)} 
              placeholder="Ex: SEDUC"
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Palavra-passe</label>
            <input 
              type="password" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••" 
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none transition-all" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#059669] hover:bg-emerald-700 text-white font-bold p-3 rounded-md transition-colors mt-2"
          >
            Entrar no SICADI
          </button>
        </form>
      </div>
    </main>
  );
}