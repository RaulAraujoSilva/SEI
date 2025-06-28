import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  FileDownload,
  Psychology,
  Assignment,
  CalendarToday,
  Business,
  Category,
  Link as LinkIcon,
  Description,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Update,
  AttachFile,
  Tag,
  PictureAsPdf,
  Article,
  ExpandMore,
  SmartToy,
  AutoAwesome,
  Person,
  AccountBalance,
  MonetizationOn,
  LocationCity,
  TrendingUp,
  BusinessCenter,
} from '@mui/icons-material';
import { 
  useDocumento, 
  useDocumentoTags, 
  useDocumentoEntidades, 
  useUpdateDocumento,
  useAnalisarDocumento,
  useProcesso
} from '../hooks/useApi';
import StatusChip from '../components/StatusChip';
import { formatDate, formatFileSize } from '../utils';
import { Documento, StatusType, Tag as TagType, Entidade } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DocumentoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documentoId = parseInt(id || '0');
  
  // Hooks para dados reais
  const { data: documento, isLoading, error, refetch } = useDocumento(documentoId);
  const { data: tags, isLoading: loadingTags } = useDocumentoTags(documentoId);
  const { data: entidades, isLoading: loadingEntidades } = useDocumentoEntidades(documentoId);
  const { data: processo } = useProcesso(documento?.processo_id || 0);
  const updateDocumentoMutation = useUpdateDocumento();
  const analisarDocumentoMutation = useAnalisarDocumento();

  // Estados locais
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [analyzeDialog, setAnalyzeDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Documento>>({});

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    if (documento) {
      setEditFormData(documento);
      setEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDocumentoMutation.mutateAsync({ 
        id: documentoId, 
        data: editFormData 
      });
      setEditDialog(false);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
    }
  };

  const handleAnalyze = async () => {
    try {
      await analisarDocumentoMutation.mutateAsync(documentoId);
      setAnalyzeDialog(false);
      refetch();
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
    }
  };

  const handleDownload = () => {
    if (documento?.url_documento) {
      window.open(documento.url_documento, '_blank');
    }
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'concluido': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'erro': return <Error sx={{ color: 'error.main' }} />;
      case 'processando': return <Schedule sx={{ color: 'warning.main' }} />;
      default: return <Warning sx={{ color: 'grey.500' }} />;
    }
  };

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('Memorando') || tipo.includes('Ofício')) return 'primary';
    if (tipo.includes('Relatório') || tipo.includes('Análise')) return 'info';
    if (tipo.includes('Planilha') || tipo.includes('Orçamento')) return 'success';
    if (tipo.includes('Contrato') || tipo.includes('Termo')) return 'warning';
    if (tipo.includes('Parecer') || tipo.includes('Decisão')) return 'error';
    return 'default';
  };

  // Agrupar entidades por tipo
  const entidadesPorTipo = entidades?.reduce((acc, entidade) => {
    const tipo = entidade.tipo || 'Outros';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(entidade);
    return acc;
  }, {} as Record<string, Entidade[]>) || {};

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !documento) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar detalhes do documento. {error?.message}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link 
              color="inherit" 
              onClick={(e) => { e.preventDefault(); navigate('/processos'); }}
              sx={{ cursor: 'pointer' }}
            >
              Processos
            </Link>
            {processo && (
              <Link 
                color="inherit" 
                onClick={(e) => { e.preventDefault(); navigate(`/processos/${documento.processo_id}`); }}
                sx={{ cursor: 'pointer' }}
              >
                {processo.numero}
              </Link>
            )}
            <Typography color="text.primary">
              {documento.numero}
            </Typography>
          </Breadcrumbs>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1">
                {documento.numero}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {documento.tipo}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleDownload}
            disabled={!documento.url_documento}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
            disabled={updateDocumentoMutation.isPending}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            href={documento.url_documento}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!documento.url_documento}
          >
            Abrir no SEI
          </Button>
        </Stack>
      </Box>

      {/* Informações Gerais do Documento */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações do Documento
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assignment color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Número:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {documento.numero}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Category color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Chip
                    label={documento.tipo}
                    color={getTipoColor(documento.tipo) as any}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarToday color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Data Documento:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(documento.data_documento || documento.created_at)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Update color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Atualizado:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(documento.updated_at)}
                  </Typography>
                </Box>
              </Grid>

              {documento.descricao && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <Description color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Descrição:
                      </Typography>
                      <Typography variant="body1">
                        {documento.descricao}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Status de Análise */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  {getStatusIcon(documento.detalhamento_status as StatusType || 'pendente')}
                  <Typography variant="subtitle1">
                    Status da Análise
                  </Typography>
                </Box>
                <StatusChip 
                  status={documento.detalhamento_status as StatusType || 'pendente'} 
                  size="medium" 
                />
                
                {documento.detalhamento_status === 'concluido' && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Modelo: {documento.detalhamento_modelo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tokens: {documento.detalhamento_tokens?.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analisado: {formatDate(documento.detalhamento_data)}
                    </Typography>
                  </Box>
                )}

                {documento.detalhamento_status === 'pendente' && (
                  <Box mt={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Psychology />}
                      onClick={() => setAnalyzeDialog(true)}
                      disabled={analisarDocumentoMutation.isPending}
                    >
                      {analisarDocumentoMutation.isPending ? 'Analisando...' : 'Analisar com IA'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Info do Arquivo */}
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AttachFile color="primary" />
                  <Typography variant="subtitle1">
                    Arquivo
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PictureAsPdf color="error" />
                  <Typography variant="body2">
                    {documento.numero}.pdf
                  </Typography>
                </Box>
                
                {documento.tamanho_arquivo && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tamanho: {formatFileSize(documento.tamanho_arquivo)}
                  </Typography>
                )}
                
                <Chip
                  label={documento.url_documento ? "Disponível" : "Não disponível"}
                  color={documento.url_documento ? "success" : "warning"}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Abas de Detalhes */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Texto de Análise" />
            <Tab label={`Tags (${tags?.length || 0})`} />
            <Tab label={`Entidades (${entidades?.length || 0})`} />
          </Tabs>
        </Box>

        <CustomTabPanel value={tabValue} index={0}>
          {documento.detalhamento_texto ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Análise Gerada pelo LLM
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                  {documento.detalhamento_texto}
                </Typography>
              </Paper>
            </Box>
          ) : (
            <Alert severity="info">
              Este documento ainda não foi analisado pelo LLM. 
              Clique em "Analisar com IA" para gerar a análise automática.
            </Alert>
          )}
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={1}>
          {loadingTags ? (
            <CircularProgress />
          ) : tags && tags.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Tags Identificadas
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.tag}
                    color="primary"
                    variant="outlined"
                    size="medium"
                    icon={<Tag />}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Alert severity="info">
              Nenhuma tag foi identificada para este documento.
            </Alert>
          )}
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={2}>
          {loadingEntidades ? (
            <CircularProgress />
          ) : entidades && entidades.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Entidades Extraídas
              </Typography>
              {Object.entries(entidadesPorTipo).map(([tipo, entidadesDoTipo]) => (
                <Accordion key={tipo} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">
                      {tipo} ({entidadesDoTipo.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {entidadesDoTipo.map((entidade) => (
                        <ListItem key={entidade.id}>
                          <ListItemIcon>
                            {tipo === 'PESSOA' && <Person />}
                            {tipo === 'ORGANIZACAO' && <Business />}
                            {tipo === 'VALOR' && <MonetizationOn />}
                            {tipo === 'LOCAL' && <LocationCity />}
                            {!['PESSOA', 'ORGANIZACAO', 'VALOR', 'LOCAL'].includes(tipo) && <Article />}
                          </ListItemIcon>
                          <ListItemText
                            primary={entidade.valor}
                            secondary={`Confiança: ${(entidade.confianca * 100).toFixed(1)}%`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              Nenhuma entidade foi identificada para este documento.
            </Alert>
          )}
        </CustomTabPanel>
      </Paper>

      {/* Dialog de Edição */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Documento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Tipo"
                value={editFormData.tipo || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, tipo: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={editFormData.descricao || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, descricao: e.target.value }))}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={updateDocumentoMutation.isPending}
          >
            {updateDocumentoMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Análise */}
      <Dialog open={analyzeDialog} onClose={() => setAnalyzeDialog(false)}>
        <DialogTitle>Analisar Documento com IA</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Deseja iniciar a análise automática deste documento usando IA?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            O processo pode levar alguns minutos e irá gerar:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><SmartToy fontSize="small" /></ListItemIcon>
              <ListItemText primary="Resumo automático do conteúdo" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Tag fontSize="small" /></ListItemIcon>
              <ListItemText primary="Tags de classificação" />
            </ListItem>
            <ListItem>
              <ListItemIcon><AutoAwesome fontSize="small" /></ListItemIcon>
              <ListItemText primary="Extração de entidades relevantes" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyzeDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAnalyze} 
            variant="contained"
            disabled={analisarDocumentoMutation.isPending}
          >
            {analisarDocumentoMutation.isPending ? 'Analisando...' : 'Iniciar Análise'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentoDetails; 