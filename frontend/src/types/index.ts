// ============================================================================
// TIPOS PRINCIPAIS DO SISTEMA SEI-COM AI
// ============================================================================

// Status possíveis para documentos e análises
export type StatusType = 'concluido' | 'pendente' | 'erro' | 'processando';

// Removido: SituacaoProcesso e TipoProcesso - não fazem parte da especificação SEI

// ============================================================================
// PROCESSO (ALINHADO COM ESPECIFICAÇÃO SEI)
// ============================================================================
export interface Processo {
  id: number;
  numero: string;                     // SEI-070002/013015/2024 (webscrape)
  tipo: string;                       // Webscrape - tipo do processo
  data_geracao: string;               // Webscrape - data de geração
  interessados: string;               // Webscrape - interessados
  url_processo: string;               // Informado pelo usuário
  observacao_usuario?: string;        // Opcional - observação do usuário
  hash_conteudo?: string;             // Sistema - hash para mudanças
  created_at: string;
  updated_at: string;                 // Data última atualização automática
  
  // Relacionamentos
  documentos?: Documento[];
  andamentos?: Andamento[];
  
  // Métricas calculadas
  total_documentos?: number;
  documentos_analisados?: number;
  custo_total_llm?: number;
  localizacao_atual?: string;        // Unidade atual do processo
}

export interface ProcessoCreate {
  numero: string;
  tipo: string;
  data_geracao: string;
  interessados: string;
  url_processo: string;
  observacao_usuario?: string;
}

export interface ProcessoUpdate {
  tipo?: string;
  data_geracao?: string;
  interessados?: string;
  url_processo?: string;
  observacao_usuario?: string;
}

// ============================================================================
// DOCUMENTO (ALINHADO COM ESPECIFICAÇÃO SEI)
// ============================================================================
export interface Documento {
  id: number;
  processo_id: number;
  numero_documento: string;           // Webscrape - número do documento
  url_documento?: string;             // Webscrape - link para documento
  tipo: string;                       // Webscrape - tipo do documento
  data_documento?: string;            // Webscrape - data do documento
  data_inclusao?: string;             // Webscrape - data de inclusão
  unidade?: string;                   // Webscrape - unidade
  assunto_documento?: string;         // LLM - assunto gerado pelo LLM
  
  // Campos técnicos
  arquivo_path?: string;              // Caminho local do arquivo
  downloaded?: boolean;               // Se foi baixado
  detalhamento_status: StatusType;    // Status da análise LLM
  detalhamento_modelo?: string;       // Modelo LLM usado
  detalhamento_tokens?: number;       // Tokens utilizados
  detalhamento_data?: string;         // Data da análise
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  processo?: Processo;
  tags?: Tag[];
  entidades?: Entidade[];
}

export interface DocumentoCreate {
  processo_id: number;
  numero_documento: string;
  url_documento?: string;
  tipo: string;
  data_documento?: string;
  data_inclusao?: string;
  unidade?: string;
}

// ============================================================================
// ANDAMENTO (ESPECIFICAÇÃO SEI)
// ============================================================================
export interface Andamento {
  id: number;
  processo_id: number;
  data_hora: string;                  // Webscrape - data/hora
  unidade: string;                    // Webscrape - unidade
  descricao: string;                  // Webscrape - descrição
  localizacao_atual: boolean;         // Sistema - se é localização atual
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
  total: number;
  por_tipo: Record<string, number>;        // Tipos dinâmicos do webscrape
  por_mes: Array<{
    mes: string;
    total: number;
  }>;
}

export interface EstatisticasDocumentos {
  total: number;
  analisados: number;
  pendentes: number;
  com_erro: number;
  por_tipo: Record<string, number>;
  tamanho_medio: number;
}

export interface EstatisticasLLM {
  total_analises: number;
  analises_sucesso: number;
  analises_erro: number;
  tokens_total: number;
  custo_total: number;
  tempo_medio: number;
  por_modelo: Record<string, {
    total: number;
    sucesso: number;
    custo: number;
  }>;
}

// ============================================================================
// CONFIGURAÇÕES LLM
// ============================================================================
export interface ConfiguracaoLLM {
  id: number;
  provider: string;
  modelo: string;
  api_key?: string;
  temperatura: number;
  max_tokens: number;
  chunk_size: number;
  max_chunks: number;
  timeout: number;
  custo_input_1k: number;
  custo_output_1k: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoLLMUpdate {
  provider?: string;
  modelo?: string;
  api_key?: string;
  temperatura?: number;
  max_tokens?: number;
  chunk_size?: number;
  max_chunks?: number;
  timeout?: number;
  custo_input_1k?: number;
  custo_output_1k?: number;
  ativo?: boolean;
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
// PAGINAÇÃO E FILTROS
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

export interface ProcessoFilters extends PaginationParams {
  numero?: string;
  tipo?: string;                    // Filtro por tipo dinâmico
  interessados?: string;            // Ajustado para corresponder ao campo
  data_inicio?: string;
  data_fim?: string;
}

export interface DocumentoFilters extends PaginationParams {
  processo_id?: number;
  tipo?: string;
  status_analise?: StatusType;
  busca_conteudo?: string;
  data_inicio?: string;
  data_fim?: string;
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
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    llm: 'ok' | 'error';
    storage: 'ok' | 'error';
  };
  version: string;
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
  data_geracao: string;
  interessados: string;
  url_processo: string;
  observacao_usuario: string;
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