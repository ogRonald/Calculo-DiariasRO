'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { atualizarPerfil } from '../../services/api';

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
  const [erro, setErro] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Novos estados para o Modal de Senha
  const [showModal, setShowModal] = useState(false);
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');

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

  // Ao invés de salvar direto, este botão agora abre o modal
  const handleAbrirModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSenhaConfirmacao('');
    setShowModal(true);
  };

  // Função que realmente envia os dados para a API com a senha
  const confirmarSalvamento = async () => {
    if (!senhaConfirmacao) {
      setErro('A senha é obrigatória para salvar as alterações.');
      setShowModal(false);
      return;
    }

    if (usuario) {
      setIsLoading(true);
      setErro('');
      try {
        await atualizarPerfil(usuario.id, {
          nomeCompleto: formData.nomeCompleto,
          funcao: formData.funcao,
          email: formData.email,
          celular: formData.celular,
          senha: senhaConfirmacao // Enviando a senha para a API
        });

        const usuarioAtualizado = { ...usuario, ...formData };
        localStorage.setItem('diarias-user', JSON.stringify(usuarioAtualizado));
        setSalvo(true);
        setShowModal(false);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (err: any) {
        // Se a API retornar 401 novamente, cai aqui
        setErro(err.message || 'Erro ao salvar. Verifique se a sua senha está correta.');
        setShowModal(false);
      } finally {
        setIsLoading(false);
      }
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

      {/* MODAL DE CONFIRMAÇÃO DE SENHA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm border-t-4 border-[#0F2C59] animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-[#0F2C59] mb-2">Confirmar Identidade</h3>
            <p className="text-sm text-slate-600 mb-5">
              Por questões de segurança, insira a sua senha para confirmar a alteração dos dados.
            </p>
            
            <input 
              type="password" 
              value={senhaConfirmacao}
              onChange={(e) => setSenhaConfirmacao(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F2C59] focus:outline-none mb-5"
              placeholder="••••••••"
              autoFocus
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarSalvamento}
                disabled={isLoading || !senhaConfirmacao}
                className="px-4 py-2 text-sm font-medium bg-[#0F2C59] text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading ? 'A validar...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-md text-center">
            {erro}
          </div>
        )}

        {salvo && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-md text-center">
            Perfil salvo com sucesso! Redirecionando...
          </div>
        )}

        {/* O onSubmit agora chama handleAbrirModal em vez de salvar diretamente */}
        <form onSubmit={handleAbrirModal} className="space-y-4">
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
                disabled={isLoading}
                className="text-slate-600 font-medium hover:text-slate-900 px-4 py-2"
              >
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`bg-[#0F2C59] hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-md transition-colors w-full ${editando ? 'ml-auto max-w-[200px]' : ''} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              Salvar Perfil
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}