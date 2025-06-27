import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  AppState,
  Processo,
  Documento,
  Notificacao,
  ProcessoFilters,
  DocumentoFilters,
} from '../types';

// ============================================================================
// STORE PRINCIPAL DA APLICAÇÃO
// ============================================================================
interface MainStore extends AppState {
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notificacao, 'id' | 'timestamp' | 'lida'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useMainStore = create<MainStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: {
          name: 'Administrador',
          email: 'admin@sistema.com',
          role: 'Gestor de Processos',
        },
        theme: 'light',
        notifications: [],
        loading: false,
        error: null,

        // Actions
        setTheme: (theme) => set({ theme }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        
        addNotification: (notification) => {
          const newNotification: Notificacao = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            lida: false,
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Máximo 50 notificações
          }));
        },
        
        markNotificationRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, lida: true } : n
            ),
          }));
        },
        
        clearNotifications: () => set({ notifications: [] }),
      }),
      {
        name: 'sei-com-ai-main-store',
        partialize: (state) => ({
          user: state.user,
          theme: state.theme,
        }),
      }
    ),
    { name: 'MainStore' }
  )
);

// ============================================================================
// STORE DE PROCESSOS
// ============================================================================
interface ProcessosStore {
  processos: Processo[];
  processo_atual: Processo | null;
  loading: boolean;
  error: string | null;
  filtros: ProcessoFilters;
  paginacao: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };

  // Actions
  setProcessos: (processos: Processo[]) => void;
  setProcessoAtual: (processo: Processo | null) => void;
  addProcesso: (processo: Processo) => void;
  updateProcesso: (id: number, processo: Partial<Processo>) => void;
  removeProcesso: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFiltros: (filtros: Partial<ProcessoFilters>) => void;
  setPaginacao: (paginacao: Partial<ProcessosStore['paginacao']>) => void;
  clearFiltros: () => void;
}

export const useProcessosStore = create<ProcessosStore>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      processos: [],
      processo_atual: null,
      loading: false,
      error: null,
      filtros: {
        page: 1,
        size: 10,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      paginacao: {
        total: 0,
        page: 1,
        size: 10,
        pages: 0,
      },

      // Actions
      setProcessos: (processos) => set({ processos }),
      setProcessoAtual: (processo_atual) => set({ processo_atual }),
      
      addProcesso: (processo) => {
        set((state) => ({
          processos: [processo, ...state.processos],
          paginacao: {
            ...state.paginacao,
            total: state.paginacao.total + 1,
          },
        }));
      },
      
      updateProcesso: (id, processo) => {
        set((state) => ({
          processos: state.processos.map((p) =>
            p.id === id ? { ...p, ...processo } : p
          ),
          processo_atual: state.processo_atual?.id === id 
            ? { ...state.processo_atual, ...processo }
            : state.processo_atual,
        }));
      },
      
      removeProcesso: (id) => {
        set((state) => ({
          processos: state.processos.filter((p) => p.id !== id),
          processo_atual: state.processo_atual?.id === id ? null : state.processo_atual,
          paginacao: {
            ...state.paginacao,
            total: Math.max(0, state.paginacao.total - 1),
          },
        }));
      },
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      setFiltros: (filtros) => {
        set((state) => ({
          filtros: { ...state.filtros, ...filtros },
        }));
      },
      
      setPaginacao: (paginacao) => {
        set((state) => ({
          paginacao: { ...state.paginacao, ...paginacao },
        }));
      },
      
      clearFiltros: () => {
        set({
          filtros: {
            page: 1,
            size: 10,
            sort_by: 'created_at',
            sort_order: 'desc',
          },
        });
      },
    }),
    { name: 'ProcessosStore' }
  )
);

// ============================================================================
// STORE DE DOCUMENTOS
// ============================================================================
interface DocumentosStore {
  documentos: Documento[];
  documento_atual: Documento | null;
  loading: boolean;
  error: string | null;
  filtros: DocumentoFilters;
  paginacao: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };

  // Actions
  setDocumentos: (documentos: Documento[]) => void;
  setDocumentoAtual: (documento: Documento | null) => void;
  addDocumento: (documento: Documento) => void;
  updateDocumento: (id: number, documento: Partial<Documento>) => void;
  removeDocumento: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFiltros: (filtros: Partial<DocumentoFilters>) => void;
  setPaginacao: (paginacao: Partial<DocumentosStore['paginacao']>) => void;
  clearFiltros: () => void;
}

export const useDocumentosStore = create<DocumentosStore>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      documentos: [],
      documento_atual: null,
      loading: false,
      error: null,
      filtros: {
        page: 1,
        size: 12,
        sort_by: 'data_upload',
        sort_order: 'desc',
      },
      paginacao: {
        total: 0,
        page: 1,
        size: 12,
        pages: 0,
      },

      // Actions
      setDocumentos: (documentos) => set({ documentos }),
      setDocumentoAtual: (documento_atual) => set({ documento_atual }),
      
      addDocumento: (documento) => {
        set((state) => ({
          documentos: [documento, ...state.documentos],
          paginacao: {
            ...state.paginacao,
            total: state.paginacao.total + 1,
          },
        }));
      },
      
      updateDocumento: (id, documento) => {
        set((state) => ({
          documentos: state.documentos.map((d) =>
            d.id === id ? { ...d, ...documento } : d
          ),
          documento_atual: state.documento_atual?.id === id 
            ? { ...state.documento_atual, ...documento }
            : state.documento_atual,
        }));
      },
      
      removeDocumento: (id) => {
        set((state) => ({
          documentos: state.documentos.filter((d) => d.id !== id),
          documento_atual: state.documento_atual?.id === id ? null : state.documento_atual,
          paginacao: {
            ...state.paginacao,
            total: Math.max(0, state.paginacao.total - 1),
          },
        }));
      },
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      setFiltros: (filtros) => {
        set((state) => ({
          filtros: { ...state.filtros, ...filtros },
        }));
      },
      
      setPaginacao: (paginacao) => {
        set((state) => ({
          paginacao: { ...state.paginacao, ...paginacao },
        }));
      },
      
      clearFiltros: () => {
        set({
          filtros: {
            page: 1,
            size: 12,
            sort_by: 'data_upload',
            sort_order: 'desc',
          },
        });
      },
    }),
    { name: 'DocumentosStore' }
  )
);

// ============================================================================
// SELETORES UTILITÁRIOS
// ============================================================================
export const useNotificationsCount = () => {
  return useMainStore((state) => 
    state.notifications.filter((n) => !n.lida).length
  );
};

export const useProcessosCount = () => {
  return useProcessosStore((state) => state.paginacao.total);
};

export const useDocumentosCount = () => {
  return useDocumentosStore((state) => state.paginacao.total);
};

// ============================================================================
// ACTIONS GLOBAIS
// ============================================================================
export const actions = {
  // Notificações
  showSuccess: (mensagem: string) => {
    useMainStore.getState().addNotification({
      tipo: 'sucesso',
      titulo: 'Sucesso',
      mensagem,
    });
  },
  
  showError: (mensagem: string) => {
    useMainStore.getState().addNotification({
      tipo: 'erro',
      titulo: 'Erro',
      mensagem,
    });
  },
  
  showInfo: (mensagem: string) => {
    useMainStore.getState().addNotification({
      tipo: 'info',
      titulo: 'Informação',
      mensagem,
    });
  },
  
  showWarning: (mensagem: string) => {
    useMainStore.getState().addNotification({
      tipo: 'aviso',
      titulo: 'Atenção',
      mensagem,
    });
  },
  
  // Loading global
  setGlobalLoading: (loading: boolean) => {
    useMainStore.getState().setLoading(loading);
  },
  
  // Error global
  setGlobalError: (error: string | null) => {
    useMainStore.getState().setError(error);
  },
}; 