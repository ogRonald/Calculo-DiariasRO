'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Usuario {
  id: string;
  nomeCompleto: string;
  matricula: string;
  funcao: string;
  email: string;
  celular: string;
}

interface DiariasContextData {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  formData: any;
  atualizarCampoForm: (campo: string, valor: any) => void;
  resultadoCalculo: any;
  setResultadoCalculo: (resultado: any) => void;
  limparFormulario: () => void;
}

const DiariasContext = createContext<DiariasContextData>({} as DiariasContextData);

export function DiariasProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [resultadoCalculo, setResultadoCalculo] = useState<any>(null);

  const [formData, setFormData] = useState({
    servidor: '',
    matricula: '',
    orgao: '',
    destino: '',
    tipo: 2,
    categoria: 4,
    dataHoraInicio: '',
    dataHoraFim: '',
    tipoRegra: 'Padrao',
    cotacaoDolar: null,
    hospedagemInclusa: false,
    custosTotaisTerceiros: false,
  });

  // Hidratação imediata do usuário ao carregar ou dar F5
  useEffect(() => {
    try {
      const userSalvo = localStorage.getItem('diarias-user');
      if (userSalvo) {
        setUsuario(JSON.parse(userSalvo));
      }
    } catch (e) {
      console.error('Falha ao restaurar sessão local', e);
    }
  }, []);

  const atualizarCampoForm = (campo: string, valor: any) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const limparFormulario = () => {
    setFormData({
      servidor: '',
      matricula: '',
      orgao: '',
      destino: '',
      tipo: 2,
      categoria: 4,
      dataHoraInicio: '',
      dataHoraFim: '',
      tipoRegra: 'Padrao',
      cotacaoDolar: null,
      hospedagemInclusa: false,
      custosTotaisTerceiros: false,
    });
    setResultadoCalculo(null);
  };

  return (
    <DiariasContext.Provider
      value={{
        usuario,
        setUsuario,
        formData,
        atualizarCampoForm,
        resultadoCalculo,
        setResultadoCalculo,
        limparFormulario,
      }}
    >
      {children}
    </DiariasContext.Provider>
  );
}

export function useDiarias() {
  const context = useContext(DiariasContext);
  if (!context) {
    throw new Error('useDiarias deve ser usado dentro de um DiariasProvider');
  }
  return context;
}