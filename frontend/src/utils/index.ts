// ============================================================================
// UTILITÁRIOS GERAIS DO SISTEMA SEI-COM AI
// ============================================================================

/**
 * Formata uma data para o padrão brasileiro
 * @param date String ISO ou objeto Date
 * @returns Data formatada DD/MM/AAAA
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Formata uma data e hora para o padrão brasileiro
 * @param date String ISO ou objeto Date
 * @returns Data e hora formatada DD/MM/AAAA HH:MM
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Formata um valor em Real brasileiro
 * @param value Valor numérico
 * @returns Valor formatado R$ 0,00
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formata um número com separadores de milhares
 * @param value Valor numérico
 * @returns Número formatado
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  return value.toLocaleString('pt-BR');
};

/**
 * Formata bytes para unidades legíveis
 * @param bytes Tamanho em bytes
 * @returns Tamanho formatado (KB, MB, GB)
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Capitaliza a primeira letra de cada palavra
 * @param text Texto a ser capitalizado
 * @returns Texto capitalizado
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Trunca texto com reticências
 * @param text Texto a ser truncado
 * @param maxLength Tamanho máximo
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Valida se um email é válido
 * @param email Email a ser validado
 * @returns true se válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se um CPF é válido
 * @param cpf CPF a ser validado
 * @returns true se válido
 */
export const isValidCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do algoritmo do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

/**
 * Formata CPF com máscara
 * @param cpf CPF sem formatação
 * @returns CPF formatado XXX.XXX.XXX-XX
 */
export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ com máscara
 * @param cnpj CNPJ sem formatação
 * @returns CNPJ formatado XX.XXX.XXX/XXXX-XX
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata telefone com máscara
 * @param phone Telefone sem formatação
 * @returns Telefone formatado
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Gera uma cor baseada em string (para avatars, etc)
 * @param str String base
 * @returns Cor em hexadecimal
 */
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

/**
 * Calcula tempo decorrido em formato legível
 * @param date Data inicial
 * @returns Tempo decorrido (ex: "2 horas atrás")
 */
export const timeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  
  return formatDate(past);
};

/**
 * Debounce function para otimizar chamadas
 * @param func Função a ser executada
 * @param wait Tempo de espera em ms
 * @returns Função debounced
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Copia texto para a área de transferência
 * @param text Texto a ser copiado
 * @returns Promise<boolean> - true se copiado com sucesso
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar para área de transferência:', error);
    return false;
  }
};

/**
 * Download de arquivo via URL
 * @param url URL do arquivo
 * @param filename Nome do arquivo
 */
export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Converte status para cor do Material-UI
 * @param status Status do sistema
 * @returns Cor do Material-UI
 */
export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status.toLowerCase()) {
    case 'concluido':
    case 'success':
    case 'ativo':
      return 'success';
    case 'erro':
    case 'error':
    case 'falha':
      return 'error';
    case 'pendente':
    case 'warning':
    case 'aguardando':
      return 'warning';
    case 'processando':
    case 'info':
    case 'em_andamento':
      return 'info';
    case 'primary':
      return 'primary';
    case 'secondary':
      return 'secondary';
    default:
      return 'default';
  }
}; 