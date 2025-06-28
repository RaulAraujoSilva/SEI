import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

// Tipos para preview de scraping
export interface ProcessoInfoPreview {
  numero: string;
  tipo: string;
  data_autuacao: string;
  interessado?: string;
}

export interface ProtocoloInfoPreview {
  numero: string;
  tipo: string;
  data: string;
  data_inclusao: string;
  unidade: string;
  url?: string;
}

export interface AndamentoInfoPreview {
  data_hora: string;
  unidade: string;
  descricao: string;
}

export interface ScrapingPreviewResponse {
  autuacao: ProcessoInfoPreview;
  protocolos: ProtocoloInfoPreview[];
  andamentos: AndamentoInfoPreview[];
  url_original: string;
  total_protocolos: number;
  total_andamentos: number;
}

export interface SalvarProcessoCompletoRequest {
  url: string;
  autuacao: ProcessoInfoPreview;
  protocolos: ProtocoloInfoPreview[];
  andamentos: AndamentoInfoPreview[];
}

export interface SalvarProcessoCompletoResponse {
  processo_id: number;
  protocolos_salvos: number;
  andamentos_salvos: number;
  sucesso: boolean;
  mensagem: string;
}

export const useScrapingPreview = () => {
  const previewScraping = useMutation({
    mutationFn: async (url: string): Promise<ScrapingPreviewResponse> => {
      // Usar o método request privado através de uma chamada direta ao axios
      const response = await (api as any).api.post('/processos/scrape-preview', { url });
      return response.data;
    },
    onError: (error: any) => {
      console.error('Erro no preview de scraping:', error);
    }
  });

  const salvarProcessoCompleto = useMutation({
    mutationFn: async (dados: SalvarProcessoCompletoRequest): Promise<SalvarProcessoCompletoResponse> => {
      // Usar o método request privado através de uma chamada direta ao axios
      const response = await (api as any).api.post('/processos/salvar-completo', dados);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Erro ao salvar processo completo:', error);
    }
  });

  return {
    previewScraping,
    salvarProcessoCompleto,
    isLoading: previewScraping.isPending || salvarProcessoCompleto.isPending
  };
}; 