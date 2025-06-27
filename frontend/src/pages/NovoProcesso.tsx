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
import { Processo } from '../types';

interface FormData {
  numero: string;
  tipo: string;
  data_geracao: string;
  interessados: string;
  url_processo: string;
  observacao_usuario?: string;
}

interface FormErrors {
  numero?: string;
  tipo?: string;
  data_geracao?: string;
  interessados?: string;
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

const NovoProcesso: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    numero: '',
    tipo: '',
    data_geracao: new Date().toISOString().split('T')[0],
    interessados: '',
    url_processo: '',
    observacao_usuario: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
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
        
      case 'data_geracao':
        if (!value) return 'Data de geração é obrigatória';
        const data = new Date(value);
        const hoje = new Date();
        if (data > hoje) return 'Data não pode ser futura';
        return undefined;
        
      case 'interessados':
        if (!value.trim()) return 'Interessados são obrigatórios';
        if (value.length < 5) return 'Descreva os interessados com mais detalhes';
        return undefined;
        
      case 'url_processo':
        if (!value.trim()) return 'URL do processo é obrigatória';
        if (!value.includes('sei.rj.gov.br')) {
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
      if (field !== 'observacao_usuario') { // Campo opcional
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
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const novoDocumento: DocumentoUpload = {
        id: Math.random().toString(36).substr(2, 9),
        nome: file.name,
        arquivo: file,
        tipo: file.type,
        tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        status: 'pendente',
        progresso: 0
      };
      
      setDocumentos(prev => [...prev, novoDocumento]);
      
      // Simular upload
      setTimeout(() => {
        setDocumentos(prev => prev.map(doc => 
          doc.id === novoDocumento.id ? { ...doc, status: 'uploading' } : doc
        ));
        
        // Progresso do upload
        let progresso = 0;
        const interval = setInterval(() => {
          progresso += Math.random() * 20;
          if (progresso >= 100) {
            progresso = 100;
            clearInterval(interval);
            setDocumentos(prev => prev.map(doc => 
              doc.id === novoDocumento.id 
                ? { ...doc, status: 'concluido', progresso: 100 } 
                : doc
            ));
          } else {
            setDocumentos(prev => prev.map(doc => 
              doc.id === novoDocumento.id ? { ...doc, progresso } : doc
            ));
          }
        }, 200);
      }, 500);
    });
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
    
    setIsSubmitting(true);
    
    try {
      // Simular criação do processo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Criando processo:', {
        ...formData,
        documentos: documentos.map(doc => ({
          nome: doc.nome,
          tipo: doc.tipo,
          tamanho: doc.tamanho
        }))
      });
      
      setSubmitSuccess(true);
      
      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/processos');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao criar processo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-completar com base no tipo
  const handleTipoChange = (tipo: string) => {
    setFormData(prev => ({ ...prev, tipo }));
    
    // Sugerir interessados baseado no tipo
    if (tipo.includes('SEFAZ')) {
      setFormData(prev => ({ 
        ...prev, 
        interessados: prev.interessados || 'Secretaria de Estado de Fazenda - SEFAZ/RJ'
      }));
    } else if (tipo.includes('Licitação')) {
      setFormData(prev => ({ 
        ...prev, 
        interessados: prev.interessados || 'Comissão Permanente de Licitação'
      }));
    } else if (tipo.includes('PAD')) {
      setFormData(prev => ({ 
        ...prev, 
        interessados: prev.interessados || 'Corregedoria Geral do Estado'
      }));
    }
  };

  if (submitSuccess) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="success.main">
          Processo Criado com Sucesso!
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
          O processo <strong>{formData.numero}</strong> foi criado e está sendo processado.
          Você será redirecionado para a lista de processos.
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

              <Grid item xs={12} md={6}>
                <TextField
                  label="Data de Geração *"
                  type="date"
                  value={formData.data_geracao}
                  onChange={(e) => handleFieldChange('data_geracao', e.target.value)}
                  error={!!errors.data_geracao}
                  helperText={errors.data_geracao}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoComplete}
                      onChange={(e) => setAutoComplete(e.target.checked)}
                    />
                  }
                  label="Auto-completar dados da URL"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="URL do Processo no SEI *"
                  value={formData.url_processo}
                  onChange={(e) => handleFieldChange('url_processo', e.target.value)}
                  error={!!errors.url_processo}
                  helperText={errors.url_processo}
                  fullWidth
                  placeholder="https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=..."
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: verificandoUrl ? (
                      <CircularProgress size={20} />
                    ) : urlValida === true ? (
                      <CheckCircle sx={{ color: 'success.main' }} />
                    ) : urlValida === false ? (
                      <Error sx={{ color: 'error.main' }} />
                    ) : null
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Interessados *"
                  value={formData.interessados}
                  onChange={(e) => handleFieldChange('interessados', e.target.value)}
                  error={!!errors.interessados}
                  helperText={errors.interessados || 'Ex: Secretaria de Estado de Fazenda - SEFAZ/RJ'}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Descreva os órgãos ou pessoas interessadas no processo"
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Observação do Usuário"
                  value={formData.observacao_usuario}
                  onChange={(e) => handleFieldChange('observacao_usuario', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Adicione observações, contexto ou informações adicionais sobre o processo (opcional)"
                  InputProps={{
                    startAdornment: <Description sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Etapa 2: Upload de Documentos */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Documentos do Processo (Opcional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Você pode adicionar documentos relacionados ao processo. Esta etapa é opcional e pode ser feita posteriormente.
            </Typography>

            {/* Área de Upload */}
            <Card 
              variant="outlined" 
              sx={{ 
                mb: 3, 
                border: dragOver ? '2px dashed' : '1px solid',
                borderColor: dragOver ? 'primary.main' : 'divider',
                bgcolor: dragOver ? 'action.hover' : 'background.paper'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Arraste arquivos aqui ou clique para selecionar
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Formatos suportados: PDF, DOC, DOCX, XLS, XLSX
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<FileUpload />}
                >
                  Selecionar Arquivos
                  <input
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Documentos */}
            {documentos.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Documentos Adicionados ({documentos.length})
                  </Typography>
                  <List>
                    {documentos.map((doc) => (
                      <ListItem key={doc.id}>
                        <ListItemIcon>
                          {doc.status === 'concluido' ? (
                            <CheckCircle color="success" />
                          ) : doc.status === 'erro' ? (
                            <Error color="error" />
                          ) : doc.status === 'uploading' ? (
                            <CircularProgress size={24} />
                          ) : (
                            <Description color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.nome}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {doc.tamanho} • {doc.tipo}
                              </Typography>
                              {doc.status === 'uploading' && (
                                <LinearProgress 
                                  variant="determinate" 
                                  value={doc.progresso} 
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          }
                        />
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
                </CardContent>
              </Card>
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
              Revise todas as informações antes de criar o processo. Após a criação, algumas informações não poderão ser alteradas.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Informações do Processo
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Número:</Typography>
                        <Typography variant="body1" fontWeight="bold">{formData.numero}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                        <Chip label={formData.tipo} size="small" color="primary" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Data de Geração:</Typography>
                        <Typography variant="body1">{new Date(formData.data_geracao).toLocaleDateString('pt-BR')}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Status URL:</Typography>
                        <Chip 
                          label={urlValida ? "URL Válida" : "URL Não Verificada"} 
                          size="small" 
                          color={urlValida ? "success" : "warning"} 
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Interessados:</Typography>
                        <Typography variant="body1">{formData.interessados}</Typography>
                      </Grid>
                      {formData.observacao_usuario && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Observação:</Typography>
                          <Typography variant="body1">{formData.observacao_usuario}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {documentos.length > 0 && (
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Documentos ({documentos.length})
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {documentos.map((doc) => (
                        <Chip 
                          key={doc.id}
                          label={`${doc.nome} (${doc.tamanho})`}
                          size="small"
                          color={doc.status === 'concluido' ? 'success' : 'default'}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Próximos Passos
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Processo será criado"
                          secondary="Informações básicas registradas"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Psychology fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Análise automática"
                          secondary="IA analisará os documentos"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><AutoAwesome fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Pronto para uso"
                          secondary="Disponível na lista de processos"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Botões de Navegação */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
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
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
              >
                {isSubmitting ? 'Criando...' : 'Criar Processo'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default NovoProcesso; 