import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Send,
  Add,
  Delete,
  Info,
  CheckCircle,
  Warning,
  Error,
  Assignment,
  Business,
  Person,
  Link as LinkIcon,
  Description,
  CalendarToday,
  CloudUpload,
  Visibility,
  Edit,
  FileUpload,
  Psychology,
  AutoAwesome,
} from '@mui/icons-material';
import { useCreateProcesso } from '../hooks/useApi';
import { apiService } from '../services/api';
import { ProcessoCreate } from '../types';

interface FormData {
  numero: string;
  tipo: string;
  assunto: string;           // Usar 'assunto' (backend)
  interessado: string;       // Singular (backend) 
  situacao: string;
  data_autuacao: string;     // Usar data_autuacao (backend)
  orgao_autuador: string;
  url_processo?: string;
}

interface FormErrors {
  numero?: string;
  tipo?: string;
  assunto?: string;
  interessado?: string;
  situacao?: string;
  data_autuacao?: string;
  orgao_autuador?: string;
  url_processo?: string;
}

interface DocumentoUpload {
  id: string;
  nome: string;
  arquivo: File;
  tipo: string;
  tamanho: string;
  status: 'pendente' | 'uploading' | 'concluido' | 'erro';
  progresso: number;
}

const steps = [
  'Informações Básicas',
  'Documentos (Opcional)',
  'Revisão e Confirmação'
];

const tiposProcesso = [
  'Administrativo: Elaboração de Correspondência',
  'Administrativo: Controle de Processos',
  'PAD: Processo Administrativo Disciplinar',
  'PAD: Sindicância',
  'Licitação: Pregão Eletrônico',
  'Licitação: Concorrência Pública',
  'Licitação: Tomada de Preços',
  'Análise Legislativa: Projeto de Lei',
  'Análise Legislativa: Decreto',
  'Revisão Contratual: Aditivo',
  'Revisão Contratual: Rescisão',
  'Ação de Improbidade: Investigação',
  'Ação de Improbidade: Processo',
  'Orçamentário: Dotação',
  'Orçamentário: Suplementação',
  'Recursos Humanos: Contratação',
  'Recursos Humanos: Exoneração',
  'Tecnologia: Modernização',
  'Tecnologia: Segurança da Informação'
];

const situacoesProcesso = [
  'Em tramitação',
  'Aguardando documentação',
  'Em análise técnica',
  'Pendente de aprovação',
  'Concluído',
  'Arquivado',
  'Suspenso',
];

const orgaosAutuadores = [
  'SEFAZ/RJ - Secretaria de Estado de Fazenda',
  'SEFAZ/COGET - Coordenação de Gestão Tecnológica',
  'SEFAZ/CONTADORIA - Contadoria Geral do Estado',
  'SEFAZ/AUDITORIA - Auditoria Fiscal',
  'SEFAZ/DTI - Diretoria de Tecnologia da Informação',
  'SEFAZ/GABINETE - Gabinete do Secretário',
  'SEFAZ/PLANEJAMENTO - Coordenação de Planejamento',
];

const NovoProcesso: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook para criação de processo
  const createProcessoMutation = useCreateProcesso();
  
  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    numero: '',
    tipo: '',
    assunto: '',
    interessado: '',
    situacao: 'Em tramitação',
    data_autuacao: new Date().toISOString().split('T')[0],
    orgao_autuador: '',
    url_processo: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Estados dos documentos
  const [documentos, setDocumentos] = useState<DocumentoUpload[]>([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Estados de validação e preview
  const [urlValida, setUrlValida] = useState<boolean | null>(null);
  const [verificandoUrl, setVerificandoUrl] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [autoComplete, setAutoComplete] = useState(true);

  // Validação de campos
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'numero':
        if (!value.trim()) return 'Número do processo é obrigatório';
        if (!/^SEI-\d{6}\/\d{6}\/\d{4}$/.test(value)) {
          return 'Formato deve ser: SEI-000000/000000/0000';
        }
        return undefined;
        
      case 'tipo':
        if (!value.trim()) return 'Tipo do processo é obrigatório';
        return undefined;

      case 'assunto':
        if (!value.trim()) return 'Assunto do processo é obrigatório';
        if (value.length < 10) return 'Assunto deve ter pelo menos 10 caracteres';
        return undefined;
        
      case 'data_autuacao':
        if (!value) return 'Data de autuação é obrigatória';
        const data = new Date(value);
        const hoje = new Date();
        if (data > hoje) return 'Data não pode ser futura';
        return undefined;
        
      case 'interessado':
        if (!value.trim()) return 'Interessado é obrigatório';
        if (value.length < 5) return 'Descreva o interessado com mais detalhes';
        return undefined;

      case 'situacao':
        if (!value.trim()) return 'Situação é obrigatória';
        return undefined;

      case 'orgao_autuador':
        if (!value.trim()) return 'Órgão autuador é obrigatório';
        return undefined;
        
      case 'url_processo':
        if (value && !value.includes('sei.rj.gov.br')) {
          return 'URL deve ser do SEI-RJ (sei.rj.gov.br)';
        }
        return undefined;
        
      default:
        return undefined;
    }
  };

  // Verificar URL do SEI
  const verificarUrl = async (url: string) => {
    if (!url || !url.includes('sei.rj.gov.br')) {
      setUrlValida(false);
      return;
    }
    
    setVerificandoUrl(true);
    try {
      // Simular verificação da URL
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUrlValida(true);
      
      // Auto-completar dados se possível
      if (autoComplete && !formData.numero) {
        const numeroMatch = url.match(/protocolo=(\d{12})/);
        if (numeroMatch) {
          const numeroSei = `SEI-${numeroMatch[1].substring(0, 6)}/${numeroMatch[1].substring(6, 12)}/${new Date().getFullYear()}`;
          setFormData(prev => ({ ...prev, numero: numeroSei }));
        }
      }
    } catch (error) {
      setUrlValida(false);
    } finally {
      setVerificandoUrl(false);
    }
  };

  // Manipular mudanças nos campos
  const handleFieldChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar campo em tempo real
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Verificar URL automaticamente
    if (name === 'url_processo' && value) {
      const timeoutId = setTimeout(() => verificarUrl(value), 1000);
      return () => clearTimeout(timeoutId);
    }
  };

  // Validar formulário completo
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      if (field !== 'url_processo') { // Campo opcional
        const error = validateField(field, formData[field] || '');
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Navegação entre etapas
  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) {
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Upload de documentos
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !processoIdCriado) return;
    
    for (const file of Array.from(files)) {
      const novoDocumento: DocumentoUpload = {
        id: Math.random().toString(36).substr(2, 9),
        nome: file.name,
        arquivo: file,
        tipo: file.type || 'Documento',
        tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        status: 'pendente',
        progresso: 0
      };
      
      setDocumentos(prev => [...prev, novoDocumento]);
      
      try {
        // Atualizar status para uploading
        setDocumentos(prev => prev.map(doc => 
          doc.id === novoDocumento.id ? { ...doc, status: 'uploading', progresso: 10 } : doc
        ));
        
        // Upload real via API
        await apiService.uploadDocumento(processoIdCriado, file, novoDocumento.tipo);
        
        // Sucesso no upload
        setDocumentos(prev => prev.map(doc => 
          doc.id === novoDocumento.id 
            ? { ...doc, status: 'concluido', progresso: 100 } 
            : doc
        ));
        
      } catch (error) {
        console.error('Erro no upload:', error);
        // Erro no upload
        setDocumentos(prev => prev.map(doc => 
          doc.id === novoDocumento.id 
            ? { ...doc, status: 'erro', progresso: 0 } 
            : doc
        ));
      }
    }
  };

  // Remover documento
  const removerDocumento = (id: string) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveStep(0);
      return;
    }
    
    try {
      // Mapear dados do formulário para o formato do backend
      const processoData: ProcessoCreate = {
        numero: formData.numero,
        tipo: formData.tipo,
        assunto: formData.assunto,
        interessado: formData.interessado, // Singular
        situacao: formData.situacao,
        data_autuacao: formData.data_autuacao, // Usar data_autuacao
        orgao_autuador: formData.orgao_autuador,
        url_processo: formData.url_processo,
      };

      const resultado = await createProcessoMutation.mutateAsync(processoData);
      
      // Redirecionar para o processo criado
      navigate(`/processos/${resultado.id}`);
      
    } catch (error) {
      console.error('Erro ao criar processo:', error);
    }
  };

  // Auto-completar com base no tipo
  const handleTipoChange = (tipo: string) => {
    setFormData(prev => ({ ...prev, tipo }));
    
    // Sugerir interessado baseado no tipo
    if (tipo.includes('SEFAZ')) {
      setFormData(prev => ({ 
        ...prev, 
        interessado: prev.interessado || 'Secretaria de Estado de Fazenda - SEFAZ/RJ'
      }));
    } else if (tipo.includes('Licitação')) {
      setFormData(prev => ({ 
        ...prev, 
        interessado: prev.interessado || 'Comissão Permanente de Licitação'
      }));
    } else if (tipo.includes('PAD')) {
      setFormData(prev => ({ 
        ...prev, 
        interessado: prev.interessado || 'Corregedoria Geral do Estado'
      }));
    }
  };

  if (createProcessoMutation.isSuccess) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="success.main">
          Processo Criado com Sucesso!
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
          O processo <strong>{formData.numero}</strong> foi criado e está sendo processado.
          Você será redirecionado para os detalhes do processo.
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/processos')}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Novo Processo SEI
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Adicionar um novo processo do Sistema Eletrônico de Informações
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mostrar erro se houver */}
      {createProcessoMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao criar processo: {createProcessoMutation.error?.message}
        </Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ p: 3 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Conteúdo das Etapas */}
      <Paper sx={{ p: 3 }}>
        {/* Etapa 1: Informações Básicas */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações Básicas do Processo
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Preencha as informações obrigatórias do processo SEI. Todos os campos marcados com * são obrigatórios.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número do Processo *"
                  value={formData.numero}
                  onChange={(e) => handleFieldChange('numero', e.target.value)}
                  error={!!errors.numero}
                  helperText={errors.numero || 'Formato: SEI-000000/000000/0000'}
                  fullWidth
                  placeholder="SEI-070002/013015/2024"
                  InputProps={{
                    startAdornment: <Assignment sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.tipo}>
                  <InputLabel>Tipo do Processo *</InputLabel>
                  <Select
                    value={formData.tipo}
                    onChange={(e) => handleTipoChange(e.target.value)}
                    startAdornment={<Business sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    {tiposProcesso.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.tipo}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Assunto do Processo *"
                  value={formData.assunto}
                  onChange={(e) => handleFieldChange('assunto', e.target.value)}
                  error={!!errors.assunto}
                  helperText={errors.assunto || 'Descreva brevemente o assunto do processo'}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Ex: Solicitação de orçamento para aquisição de equipamentos de TI..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Data de Autuação *"
                  type="date"
                  value={formData.data_autuacao}
                  onChange={(e) => handleFieldChange('data_autuacao', e.target.value)}
                  error={!!errors.data_autuacao}
                  helperText={errors.data_autuacao}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.situacao}>
                  <InputLabel>Situação *</InputLabel>
                  <Select
                    value={formData.situacao}
                    onChange={(e) => handleFieldChange('situacao', e.target.value)}
                  >
                    {situacoesProcesso.map((situacao) => (
                      <MenuItem key={situacao} value={situacao}>
                        {situacao}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.situacao}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Interessado *"
                  value={formData.interessado}
                  onChange={(e) => handleFieldChange('interessado', e.target.value)}
                  error={!!errors.interessado}
                  helperText={errors.interessado || 'Nome do órgão, pessoa ou entidade interessada'}
                  fullWidth
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.orgao_autuador}>
                  <InputLabel>Órgão Autuador *</InputLabel>
                  <Select
                    value={formData.orgao_autuador}
                    onChange={(e) => handleFieldChange('orgao_autuador', e.target.value)}
                  >
                    {orgaosAutuadores.map((orgao) => (
                      <MenuItem key={orgao} value={orgao}>
                        {orgao}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.orgao_autuador}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoComplete}
                      onChange={(e) => setAutoComplete(e.target.checked)}
                    />
                  }
                  label="Auto-completar dados a partir da URL do SEI"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="URL do Processo no SEI"
                  value={formData.url_processo}
                  onChange={(e) => handleFieldChange('url_processo', e.target.value)}
                  error={!!errors.url_processo}
                  helperText={errors.url_processo || 'URL opcional do processo no SEI'}
                  fullWidth
                  placeholder="https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=..."
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: verificandoUrl ? (
                      <CircularProgress size={20} />
                    ) : urlValida === true ? (
                      <CheckCircle color="success" />
                    ) : urlValida === false ? (
                      <Error color="error" />
                    ) : null
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Etapa 2: Documentos */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Documentos (Opcional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Você pode adicionar documentos relacionados ao processo. Esta etapa é opcional.
            </Typography>

            {/* Upload area */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.300',
                backgroundColor: dragOver ? 'primary.50' : 'grey.50',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Arraste arquivos aqui ou clique para selecionar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX
              </Typography>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </Paper>

            {/* Lista de documentos */}
            {documentos.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Documentos Adicionados ({documentos.length})
                </Typography>
                <List>
                  {documentos.map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>
                        <Description color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.nome}
                        secondary={`${doc.tamanho} • ${doc.status}`}
                      />
                      {doc.status === 'uploading' && (
                        <Box sx={{ width: 100, mr: 2 }}>
                          <LinearProgress variant="determinate" value={doc.progresso} />
                        </Box>
                      )}
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => removerDocumento(doc.id)}
                          disabled={doc.status === 'uploading'}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {/* Etapa 3: Revisão */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Revisão e Confirmação
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Revise todas as informações antes de criar o processo.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informações do Processo
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Número:</strong> {formData.numero}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Tipo:</strong> {formData.tipo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Assunto:</strong> {formData.assunto}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Interessado:</strong> {formData.interessado}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Situação:</strong> {formData.situacao}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Data Autuação:</strong> {new Date(formData.data_autuacao).toLocaleDateString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Órgão Autuador:</strong> {formData.orgao_autuador}
                    </Typography>
                    {formData.url_processo && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>URL SEI:</strong> {formData.url_processo}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Documentos
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {documentos.length > 0 ? (
                    <List dense>
                      {documentos.map((doc) => (
                        <ListItem key={doc.id}>
                          <ListItemIcon>
                            <Description fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.nome}
                            secondary={doc.tamanho}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum documento adicionado
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Botões de navegação */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Voltar
          </Button>
          
          <Box display="flex" gap={2}>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Próximo
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={createProcessoMutation.isPending}
                startIcon={createProcessoMutation.isPending ? <CircularProgress size={20} /> : <Send />}
              >
                {createProcessoMutation.isPending ? 'Criando...' : 'Criar Processo'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default NovoProcesso; 