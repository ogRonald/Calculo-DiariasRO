'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Definir os Tipos de Dados que o nosso contexto vai guardar
type Usuario = {
  id: string;
  matricula: string;
  orgao: string;
  nomeCompleto: string;
  funcao: string;
  email: string;
  celular: string;
} | null;

type FormData = {
  servidor: string;
  matricula: string;
  orgao: string;
  destino: string;
  categoria: number;
  tipo: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  tipoRegra: string;
  cotacaoDolar: string;
  hospedagemInclusa: boolean;
  custosTotaisTerceiros: boolean;
};

type ResultadoCalculo = {
  elegivel: boolean;
  totalDias: number;
  valorUnitarioBaseBrl: number;
  valorTotalBrl: number;
  motivoIneligibilidade?: string;
} | null;

interface DiariasContextType {
  usuario: Usuario;
  setUsuario: (user: Usuario) => void;
  
  formData: FormData;
  setFormData: (data: FormData) => void;
  atualizarCampoForm: (campo: keyof FormData, valor: any) => void;
  
  resultadoCalculo: ResultadoCalculo;
  setResultadoCalculo: (resultado: ResultadoCalculo) => void;
  
  limparCalculo: () => void;
}

// 2. Criar o Contexto
const DiariasContext = createContext<DiariasContextType | undefined>(undefined);

// 3. Criar o Provider (o componente que vai envolver a aplicação)
export function DiariasProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario>(null);
  
  const [formData, setFormData] = useState<FormData>({
    servidor: '',
    matricula: '',
    orgao: '',
    destino: '',
    categoria: 4,
    tipo: 2,
    dataHoraInicio: '',
    dataHoraFim: '',
    tipoRegra: 'Padrao',
    cotacaoDolar: '',
    hospedagemInclusa: false,
    custosTotaisTerceiros: false
  });

  const [resultadoCalculo, setResultadoCalculo] = useState<ResultadoCalculo>(null);

  // Função utilitária para atualizar apenas um campo do formulário de cada vez
  const atualizarCampoForm = (campo: keyof FormData, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // Limpa o cálculo atual para começar um novo
  const limparCalculo = () => {
    setResultadoCalculo(null);
    setFormData({
      servidor: '', matricula: '', orgao: '', destino: '', categoria: 4, tipo: 2,
      dataHoraInicio: '', dataHoraFim: '', tipoRegra: 'Padrao', cotacaoDolar: '',
      hospedagemInclusa: false, custosTotaisTerceiros: false
    });
  };

  return (
    <DiariasContext.Provider value={{ 
      usuario, setUsuario, 
      formData, setFormData, atualizarCampoForm,
      resultadoCalculo, setResultadoCalculo, 
      limparCalculo 
    }}>
      {children}
    </DiariasContext.Provider>
  );
}

// 4. Hook personalizado para facilitar o uso nos outros ficheiros
export function useDiarias() {
  const context = useContext(DiariasContext);
  if (context === undefined) {
    throw new Error('useDiarias deve ser usado dentro de um DiariasProvider');
  }
  return context;
}