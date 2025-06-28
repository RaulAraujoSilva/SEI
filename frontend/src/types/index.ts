// ============================================================================
// TIPOS PRINCIPAIS DO SISTEMA SEI-COM AI
// ============================================================================

// Status possíveis para documentos e análises
export type StatusType = 'concluido' | 'pendente' | 'erro' | 'processando';

// ============================================================================
// PROCESSO (ALINHADO COM BACKEND API_SCHEMAS.PY)
// ============================================================================
export interface Processo {
  id: number;
  numero: string;                     // SEI-070002/013015/2024 (webscrape)
  tipo: string;                       // Webscrape - tipo do processo
  assunto: string;                    // Assunto do processo (backend usa 'assunto')
  interessado: string;                // Webscrape - interessado (singular no backend)
  situacao: string;                   // Situação atual do processo
  data_autuacao: string;              // Data de autuação (backend usa data_autuacao)
  orgao_autuador: string;             // Órgão autuador
  url_processo?: string;              // Informado pelo usuário
  hash_conteudo?: string;             // Sistema - hash para mudanças
  created_at: string;
  updated_at: string;                 // Data última atualização automática
  
  // Relacionamentos
  documentos?: Documento[];
  andamentos?: Andamento[];
  
  // Métricas calculadas (do backend)
  total_documentos?: number;
  total_andamentos?: number;
  documentos_analisados?: number;
}

export interface ProcessoCreate {
  numero: string;
  tipo: string;
  assunto: string;                    // Obrigatório no backend
  interessado: string;                // Singular
  situacao: string;
  data_autuacao: string;              // Usar data_autuacao
  orgao_autuador: string;
  url_processo?: string;
}

export interface ProcessoUpdate {
  tipo?: string;
  assunto?: string;                   // Backend usa 'assunto'
  interessado?: string;               // Singular
  situacao?: string;
  orgao_autuador?: string;
  url_processo?: string;
}

// ============================================================================
// DOCUMENTO (ALINHADO COM BACKEND API_SCHEMAS.PY) 
// ============================================================================
export interface Documento {
  id: number;
  processo_id: number;
  numero: string;                     // Backend usa 'numero' (não numero_documento)
  url_documento?: string;             // URL do documento
  tipo: string;                       // Tipo do documento
  data_documento: string;             // Data do documento (obrigatório no backend)
  descricao: string;                  // Backend usa 'descricao' (não assunto_documento)
  
  // Campos técnicos do backend
  tamanho_arquivo?: number;           // Tamanho do arquivo
  hash_arquivo?: string;              // Hash do arquivo
  caminho_arquivo?: string;           // Caminho do arquivo
  
  // Campos de análise LLM
  detalhamento_status?: string;       // Status da análise LLM
  detalhamento_texto?: string;        // Texto da análise
  detalhamento_modelo?: string;       // Modelo LLM usado
  detalhamento_tokens?: number;       // Tokens utilizados
  detalhamento_data?: string;         // Data da análise
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos opcionais
  tags?: Tag[];
  entidades?: Entidade[];
}

export interface DocumentoCreate {
  processo_id: number;
  numero: string;                     // Usar 'numero' (não numero_documento)
  url_documento?: string;
  tipo: string;
  data_documento: string;             // Obrigatório no backend
  descricao: string;                  // Usar 'descricao' (não assunto_documento)
}

export interface DocumentoUpdate {
  tipo?: string;
  descricao?: string;                 // Usar 'descricao'
  detalhamento_status?: string;
}

// ============================================================================
// ANDAMENTO (ESPECIFICAÇÃO SEI)
// ============================================================================
export interface Andamento {
  id: number;
  processo_id: number;
  data_hora: string;                  // Backend usa data_hora
  descricao?: string;                 // Descrição do andamento (opcional)
  unidade?: string;                   // Unidade
  created_at: string;
}

// ============================================================================
// TAG E ENTIDADES
// ============================================================================
export interface Tag {
  id: number;
  documento_id: number;
  tag: string;
  confianca: number;
  created_at: string;
}

export interface Entidade {
  id: number;
  documento_id: number;
  tipo: string;
  valor: string;
  confianca: number;
  posicao_inicio?: number;
  posicao_fim?: number;
  created_at: string;
}

// ============================================================================
// HISTÓRICO E ANÁLISES
// ============================================================================
export interface HistoricoAnalise {
  id: number;
  documento_id: number;
  modelo_llm: string;
  prompt_utilizado: string;
  resposta_llm: string;
  tokens_input: number;
  tokens_output: number;
  custo: number;
  tempo_processamento: number;
  status: StatusType;
  erro?: string;
  created_at: string;
}

// ============================================================================
// ESTATÍSTICAS E MÉTRICAS
// ============================================================================
export interface EstatisticasGerais {
  total_processos: number;
  total_documentos: number;
  documentos_analisados: number;
  custo_total_llm: number;
  taxa_sucesso: number;
}

export interface EstatisticasProcessos {
  total_processos: number;
  por_tipo: Record<string, number>;
  por_situacao: Record<string, number>;
  por_orgao: Record<string, number>;
  processos_recentes: number;
  media_documentos_por_processo: number;
}

export interface EstatisticasDocumentos {
  total_documentos: number;
  por_tipo: Record<string, number>;
  por_status_analise: Record<string, number>;
  documentos_analisados: number;
  documentos_nao_analisados: number;
  tamanho_medio_arquivo: number;
}

export interface EstatisticasLLM {
  total_documents_processed: number;
  successful_analyses: number;
  failed_analyses: number;
  total_tokens_used: number;
  total_cost_usd: number;
  average_tokens_per_document: number;
  average_cost_per_document: number;
  most_used_model?: string;
  last_analysis_at?: string;
  processing_percentage: number;
}

// ============================================================================
// CONFIGURAÇÕES LLM
// ============================================================================
export interface ConfiguracaoLLM {
  provider: string;
  model: string;
  max_tokens: number;
  temperature: number;
  chunk_size: number;
  max_chunks_per_document: number;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  timeout_seconds: number;
}

export interface ConfiguracaoLLMUpdate {
  max_tokens?: number;
  temperature?: number;
  chunk_size?: number;
  max_chunks_per_document?: number;
  timeout_seconds?: number;
}

// ============================================================================
// COLETA DE PROCESSOS
// ============================================================================
export interface ColetaProcesso {
  id: number;
  url_sei: string;
  status: StatusType;
  progresso: number;
  etapa_atual: string;
  processo_id?: number;
  opcoes: ColetaOpcoes;
  logs: ColetaLog[];
  created_at: string;
  updated_at: string;
}

export interface ColetaOpcoes {
  coletar_documentos: boolean;
  analisar_documentos: boolean;
  notificar_conclusao: boolean;
  agendar_recorrente: boolean;
}

export interface ColetaLog {
  timestamp: string;
  etapa: string;
  status: StatusType;
  mensagem: string;
  detalhes?: any;
}

export interface ColetaCreate {
  url_sei: string;
  opcoes: ColetaOpcoes;
}

// ============================================================================
// PAGINAÇÃO E FILTROS (ALINHADOS COM BACKEND)
// ============================================================================
export interface PaginationParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Filtros alinhados com ProcessoSearchParams do backend
export interface ProcessoFilters extends PaginationParams {
  numero?: string;
  tipo?: string;
  assunto?: string;                   // Backend usa 'assunto'
  interessado?: string;               // Singular (backend usa 'interessado')
  situacao?: string;
  orgao_autuador?: string;
  data_inicio?: string;               // Backend usa data_inicio/data_fim
  data_fim?: string;
}

// Filtros alinhados com DocumentoSearchParams do backend
export interface DocumentoFilters extends PaginationParams {
  processo_id?: number;
  tipo?: string;
  numero?: string;                    // Backend usa 'numero'
  descricao?: string;                 // Backend usa 'descricao'
  status_analise?: string;
  data_inicio?: string;
  data_fim?: string;
  q?: string;                         // Backend usa 'q' para busca de conteúdo
}

// ============================================================================
// NOTIFICAÇÕES E SISTEMA
// ============================================================================
export interface Notificacao {
  id: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'aviso';
  titulo: string;
  mensagem: string;
  timestamp: string;
  lida: boolean;
  acao?: {
    label: string;
    url: string;
  };
}

export interface HealthCheck {
  status: string;
  database: string;
  llm_service?: string;
  timestamp: string;
  version: string;
  uptime_seconds?: number;
}

// ============================================================================
// COMPONENTES UI
// ============================================================================
export interface StatusChipProps {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium';
}

export interface ProcessoCardProps {
  processo: Processo;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAnalyze?: (id: number) => void;
}

export interface DocumentoGridProps {
  documentos: Documento[];
  viewMode: 'grid' | 'list';
  onSelect: (documento: Documento) => void;
  loading?: boolean;
}

// ============================================================================
// HOOKS E ESTADO
// ============================================================================
export interface AppState {
  user: {
    name: string;
    email: string;
    role: string;
  };
  theme: 'light' | 'dark' | 'auto';
  notifications: Notificacao[];
  loading: boolean;
  error: string | null;
}

export interface ProcessosState {
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
}

export interface DocumentosState {
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
}

// ============================================================================
// API RESPONSES
// ============================================================================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  details?: any;
  code?: string;
}

// ============================================================================
// FORMULÁRIOS
// ============================================================================
export interface NovoProcessoForm {
  url_sei: string;
  opcoes: ColetaOpcoes;
}

export interface ProcessoForm {
  numero: string;
  tipo: string;
  assunto: string;                    // Usar 'assunto'
  interessado: string;                // Singular
  situacao: string;
  data_autuacao: string;              // Usar data_autuacao
  orgao_autuador: string;
  url_processo: string;
}

export interface ConfiguracaoForm {
  nome: string;
  email: string;
  tema: 'light' | 'dark' | 'auto';
  idioma: string;
  densidade: 'compacta' | 'normal' | 'confortavel';
  notificacoes: {
    processo_coletado: boolean;
    erro_coleta: boolean;
    analise_concluida: boolean;
    limite_orcamento: boolean;
    relatorio_semanal: boolean;
  };
} 