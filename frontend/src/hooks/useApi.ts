import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { actions } from '../store';
import {
  Processo,
  ProcessoCreate,
  ProcessoUpdate,
  ProcessoFilters,
  Documento,
  DocumentoFilters,
  EstatisticasLLM,
  ConfiguracaoLLM,
  ConfiguracaoLLMUpdate,
  ConfiguracaoForm,
} from '../types';

// ============================================================================
// HOOKS PARA PROCESSOS
// ============================================================================
export const useProcessos = (filters?: ProcessoFilters) => {
  return useQuery({
    queryKey: ['processos', filters],
    queryFn: () => apiService.getProcessos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

export const useProcesso = (id: number) => {
  return useQuery({
    queryKey: ['processo', id],
    queryFn: () => apiService.getProcesso(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProcesso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ProcessoCreate) => apiService.createProcesso(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      actions.showSuccess('Processo criado com sucesso!');
    },
    onError: (error: any) => {
      actions.showError(error.message || 'Erro ao criar processo');
    },
  });
};

export const useUpdateProcesso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProcessoUpdate }) => 
      apiService.updateProcesso(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      queryClient.invalidateQueries({ queryKey: ['processo', id] });
      actions.showSuccess('Processo atualizado com sucesso!');
    },
    onError: (error: any) => {
      actions.showError(error.message || 'Erro ao atualizar processo');
    },
  });
};

export const useDeleteProcesso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteProcesso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      actions.showSuccess('Processo excluído com sucesso!');
    },
    onError: (error: any) => {
      actions.showError(error.message || 'Erro ao excluir processo');
    },
  });
};

// ============================================================================
// HOOKS PARA DOCUMENTOS
// ============================================================================
export const useDocumentos = (filters?: DocumentoFilters) => {
  return useQuery({
    queryKey: ['documentos', filters],
    queryFn: () => apiService.getDocumentos(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useDocumento = (id: number) => {
  return useQuery({
    queryKey: ['documento', id],
    queryFn: () => apiService.getDocumento(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// HOOKS PARA DASHBOARD
// ============================================================================
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiService.getDashboardData(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });
};

// ============================================================================
// HOOKS PARA SISTEMA
// ============================================================================
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.getHealth(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Atualiza a cada 1 minuto
    retry: false,
  });
};

// ============================================================================
// HOOK GENÉRICO PARA LOADING
// ============================================================================
export const useApiLoading = (...queries: any[]) => {
  return queries.some(query => query.isLoading);
};

// ============================================================================
// HOOKS PARA LLM
// ============================================================================
export const useEstatisticasLLM = () => {
  return useQuery({
    queryKey: ['llm', 'statistics'],
    queryFn: () => apiService.getEstatisticasLLM(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Atualiza a cada 10 minutos
  });
};

export const useEstimativaCusto = () => {
  return useQuery({
    queryKey: ['llm', 'estimation'],
    queryFn: () => apiService.getEstimativaCusto(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });
};

export const useConfiguracaoLLM = () => {
  return useQuery({
    queryKey: ['llm', 'config'],
    queryFn: () => apiService.getConfiguracaoLLM(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useUpdateConfiguracaoLLM = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ConfiguracaoLLMUpdate) => apiService.updateConfiguracaoLLM(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm', 'config'] });
      queryClient.invalidateQueries({ queryKey: ['llm', 'statistics'] });
      actions.showSuccess('Configuração LLM atualizada com sucesso!');
    },
    onError: (error: any) => {
      actions.showError(error.message || 'Erro ao atualizar configuração LLM');
    },
  });
};

export const useAnalisarDocumento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.analisarDocumento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['llm', 'statistics'] });
      actions.showSuccess('Análise do documento iniciada!');
    },
    onError: (error: any) => {
      actions.showError(error.message || 'Erro ao analisar documento');
    },
  });
};

// ============================================================================
// HOOKS PARA CONFIGURAÇÕES GERAIS
// ============================================================================
export const useConfiguracoes = () => {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => apiService.getConfiguracoes(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

export const useUpdateConfiguracoes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ConfiguracaoForm) => apiService.updateConfiguracoes(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      actions.showSuccess('Configurações salvas com sucesso!');
    },
    onError: (error: any) => {
      actions.showError(error.message || 'Erro ao salvar configurações');
    },
  });
};

// ============================================================================
// HOOK PARA INVALIDAR QUERIES
// ============================================================================
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateProcessos: () => queryClient.invalidateQueries({ queryKey: ['processos'] }),
    invalidateDocumentos: () => queryClient.invalidateQueries({ queryKey: ['documentos'] }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    invalidateLLM: () => queryClient.invalidateQueries({ queryKey: ['llm'] }),
    invalidateConfiguracoes: () => queryClient.invalidateQueries({ queryKey: ['configuracoes'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}; 