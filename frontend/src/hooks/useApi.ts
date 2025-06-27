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
// HOOK PARA INVALIDAR QUERIES
// ============================================================================
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateProcessos: () => queryClient.invalidateQueries({ queryKey: ['processos'] }),
    invalidateDocumentos: () => queryClient.invalidateQueries({ queryKey: ['documentos'] }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}; 