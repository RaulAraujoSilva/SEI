import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Processo,
  ProcessoCreate,
  ProcessoUpdate,
  ProcessoFilters,
  Documento,
  DocumentoCreate,
  DocumentoFilters,
  Tag,
  Entidade,
  HistoricoAnalise,
  EstatisticasGerais,
  EstatisticasProcessos,
  EstatisticasDocumentos,
  EstatisticasLLM,
  ConfiguracaoLLM,
  ConfiguracaoLLMUpdate,
  ColetaProcesso,
  ColetaCreate,
  PaginatedResponse,
  ApiResponse,
  HealthCheck,
} from '../types';

// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para requests
    this.api.interceptors.request.use(
      (config) => {
        // Adicionar token de autenticação se existir
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para responses
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Tratamento global de erros
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.request({
        method,
        url,
        data,
        params,
      });
      return response.data;
    } catch (error: any) {
      // Log do erro para debugging
      console.error(`API Error [${method} ${url}]:`, error);
      
      // Rethrow com informações estruturadas
      throw {
        message: error.response?.data?.message || error.message || 'Erro na API',
        status: error.response?.status,
        details: error.response?.data,
      };
    }
  }

  // ============================================================================
  // SISTEMA E HEALTH CHECK
  // ============================================================================
  async getHealth(): Promise<HealthCheck> {
    return this.request<HealthCheck>('GET', '/health');
  }

  async getRoot(): Promise<{ message: string }> {
    return this.request<{ message: string }>('GET', '/');
  }

  // ============================================================================
  // PROCESSOS
  // ============================================================================
  async getProcessos(filters?: ProcessoFilters): Promise<PaginatedResponse<Processo>> {
    return this.request<PaginatedResponse<Processo>>('GET', '/processos/', null, filters);
  }

  async getProcesso(id: number): Promise<Processo> {
    return this.request<Processo>('GET', `/processos/${id}`);
  }

  async createProcesso(data: ProcessoCreate): Promise<Processo> {
    return this.request<Processo>('POST', '/processos/', data);
  }

  async updateProcesso(id: number, data: ProcessoUpdate): Promise<Processo> {
    return this.request<Processo>('PATCH', `/processos/${id}`, data);
  }

  async deleteProcesso(id: number): Promise<void> {
    return this.request<void>('DELETE', `/processos/${id}`);
  }

  async searchProcessos(filters: ProcessoFilters): Promise<PaginatedResponse<Processo>> {
    return this.request<PaginatedResponse<Processo>>('GET', '/processos/search', null, filters);
  }

  async getEstatisticasProcessos(): Promise<EstatisticasProcessos> {
    return this.request<EstatisticasProcessos>('GET', '/processos/statistics');
  }

  // ============================================================================
  // DOCUMENTOS
  // ============================================================================
  async getDocumentos(filters?: DocumentoFilters): Promise<PaginatedResponse<Documento>> {
    return this.request<PaginatedResponse<Documento>>('GET', '/documentos/', null, filters);
  }

  async getDocumento(id: number): Promise<Documento> {
    return this.request<Documento>('GET', `/documentos/${id}`);
  }

  async updateDocumento(id: number, data: Partial<Documento>): Promise<Documento> {
    return this.request<Documento>('PATCH', `/documentos/${id}`, data);
  }

  async searchDocumentos(filters: DocumentoFilters): Promise<PaginatedResponse<Documento>> {
    return this.request<PaginatedResponse<Documento>>('GET', '/documentos/search', null, filters);
  }

  async getEstatisticasDocumentos(): Promise<EstatisticasDocumentos> {
    return this.request<EstatisticasDocumentos>('GET', '/documentos/statistics');
  }

  async downloadDocumento(id: number): Promise<Blob> {
    const response = await this.api.get(`/documentos/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getDocumentoTags(id: number): Promise<Tag[]> {
    return this.request<Tag[]>('GET', `/documentos/${id}/tags`);
  }

  async getDocumentoEntidades(id: number): Promise<Entidade[]> {
    return this.request<Entidade[]>('GET', `/documentos/${id}/entidades`);
  }

  async getDocumentoHistorico(id: number): Promise<HistoricoAnalise[]> {
    return this.request<HistoricoAnalise[]>('GET', `/documentos/${id}/analysis-history`);
  }

  async getDocumentosPorProcesso(processoId: number): Promise<Documento[]> {
    return this.request<Documento[]>('GET', `/processo/${processoId}/documentos/`);
  }

  // ============================================================================
  // LLM E ANÁLISES
  // ============================================================================
  async analisarDocumento(id: number): Promise<{ message: string; task_id: string }> {
    return this.request<{ message: string; task_id: string }>('POST', `/llm/documentos/${id}/analyze`);
  }

  async getEstatisticasLLM(): Promise<EstatisticasLLM> {
    return this.request<EstatisticasLLM>('GET', '/llm/statistics');
  }

  async getEstimativaCusto(): Promise<{ estimativa_custo: number; documentos_pendentes: number }> {
    return this.request<{ estimativa_custo: number; documentos_pendentes: number }>('GET', '/llm/cost-estimation');
  }

  async getConfiguracaoLLM(): Promise<ConfiguracaoLLM> {
    return this.request<ConfiguracaoLLM>('GET', '/llm/config');
  }

  async updateConfiguracaoLLM(data: ConfiguracaoLLMUpdate): Promise<ConfiguracaoLLM> {
    return this.request<ConfiguracaoLLM>('PUT', '/llm/config', data);
  }

  // ============================================================================
  // COLETA DE PROCESSOS
  // ============================================================================
  async validarUrlSei(url: string): Promise<{ valida: boolean; dados?: any; erro?: string }> {
    return this.request<{ valida: boolean; dados?: any; erro?: string }>('POST', '/processos/validar-url', { url });
  }

  async iniciarColeta(data: ColetaCreate): Promise<ColetaProcesso> {
    return this.request<ColetaProcesso>('POST', '/coleta/iniciar', data);
  }

  async getStatusColeta(id: number): Promise<ColetaProcesso> {
    return this.request<ColetaProcesso>('GET', `/coleta/${id}/status`);
  }

  async cancelarColeta(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', `/coleta/${id}/cancelar`);
  }

  // ============================================================================
  // ESTATÍSTICAS GERAIS
  // ============================================================================
  async getEstatisticasGerais(): Promise<EstatisticasGerais> {
    return this.request<EstatisticasGerais>('GET', '/estatisticas/gerais');
  }

  async getDashboardData(): Promise<{
    estatisticas: EstatisticasGerais;
    processos_recentes: Processo[];
    atividades_recentes: any[];
    graficos: {
      processos_por_mes: Array<{ mes: string; total: number }>;
      documentos_por_status: Array<{ status: string; total: number }>;
    };
  }> {
    return this.request('GET', '/dashboard');
  }

  // ============================================================================
  // EXPORTAÇÃO
  // ============================================================================
  async exportarProcessos(filters?: ProcessoFilters, formato: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await this.api.get('/processos/export', {
      params: { ...filters, formato },
      responseType: 'blob',
    });
    return response.data;
  }

  async exportarDocumentos(filters?: DocumentoFilters, formato: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await this.api.get('/documentos/export', {
      params: { ...filters, formato },
      responseType: 'blob',
    });
    return response.data;
  }

  async gerarRelatorio(tipo: 'processos' | 'documentos' | 'llm', periodo: string): Promise<Blob> {
    const response = await this.api.get(`/relatorios/${tipo}`, {
      params: { periodo },
      responseType: 'blob',
    });
    return response.data;
  }

  // ============================================================================
  // UPLOAD DE ARQUIVOS
  // ============================================================================
  async uploadDocumento(processoId: number, file: File, tipo: string): Promise<Documento> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processo_id', processoId.toString());
    formData.append('tipo', tipo);

    const response = await this.api.post('/documentos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // ============================================================================
  // BUSCA GLOBAL
  // ============================================================================
  async buscaGlobal(query: string): Promise<{
    processos: Processo[];
    documentos: Documento[];
    total: number;
  }> {
    return this.request('GET', '/busca/global', null, { q: query });
  }

  // ============================================================================
  // CONFIGURAÇÕES DO USUÁRIO
  // ============================================================================
  async getConfiguracoes(): Promise<any> {
    return this.request('GET', '/configuracoes');
  }

  async updateConfiguracoes(data: any): Promise<any> {
    return this.request('PUT', '/configuracoes', data);
  }

  // ============================================================================
  // NOTIFICAÇÕES
  // ============================================================================
  async getNotificacoes(): Promise<any[]> {
    return this.request('GET', '/notificacoes');
  }

  async marcarNotificacaoLida(id: string): Promise<void> {
    return this.request('PATCH', `/notificacoes/${id}/lida`);
  }

  async limparNotificacoes(): Promise<void> {
    return this.request('DELETE', '/notificacoes');
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================
export const apiService = new ApiService();

// ============================================================================
// HOOKS PARA REACT QUERY
// ============================================================================
export const apiQueries = {
  // Chaves para React Query
  processos: {
    all: ['processos'] as const,
    lists: () => [...apiQueries.processos.all, 'list'] as const,
    list: (filters?: ProcessoFilters) => [...apiQueries.processos.lists(), filters] as const,
    details: () => [...apiQueries.processos.all, 'detail'] as const,
    detail: (id: number) => [...apiQueries.processos.details(), id] as const,
    statistics: () => [...apiQueries.processos.all, 'statistics'] as const,
  },
  
  documentos: {
    all: ['documentos'] as const,
    lists: () => [...apiQueries.documentos.all, 'list'] as const,
    list: (filters?: DocumentoFilters) => [...apiQueries.documentos.lists(), filters] as const,
    details: () => [...apiQueries.documentos.all, 'detail'] as const,
    detail: (id: number) => [...apiQueries.documentos.details(), id] as const,
    tags: (id: number) => [...apiQueries.documentos.detail(id), 'tags'] as const,
    entidades: (id: number) => [...apiQueries.documentos.detail(id), 'entidades'] as const,
    historico: (id: number) => [...apiQueries.documentos.detail(id), 'historico'] as const,
  },
  
  llm: {
    all: ['llm'] as const,
    statistics: () => [...apiQueries.llm.all, 'statistics'] as const,
    config: () => [...apiQueries.llm.all, 'config'] as const,
    estimation: () => [...apiQueries.llm.all, 'estimation'] as const,
  },
  
  dashboard: {
    all: ['dashboard'] as const,
    data: () => [...apiQueries.dashboard.all, 'data'] as const,
  },
  
  system: {
    all: ['system'] as const,
    health: () => [...apiQueries.system.all, 'health'] as const,
  },
};

export default apiService; 