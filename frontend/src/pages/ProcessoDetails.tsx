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
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  FileDownload,
  Visibility,
  Psychology,
  Assignment,
  CalendarToday,
  Business,
  Person,
  Category,
  Link as LinkIcon,
  Description,
  CloudDownload,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  LocationOn,
  Comment,
  Update,
  Timeline,
} from '@mui/icons-material';
import { useProcesso } from '../hooks/useApi';
import { apiService } from '../services/api';
import StatusChip from '../components/StatusChip';
import { formatDate, formatCurrency } from '../utils';
import { Processo, Documento, Andamento, StatusType } from '../types';

const ProcessoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const processoId = parseInt(id || '0');
  
  // Mock data - será substituído por hooks reais quando conectado com API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  
  // Dados mock realistas do SEI-RJ
  const processo: Processo = {
    id: processoId,
    numero: 'SEI-070002/013015/2024',
    tipo: 'Administrativo: Elaboração de Correspondência',
    data_geracao: '2024-07-16',
    interessados: 'Secretaria de Estado de Fazenda - SEFAZ/RJ, Coordenação de Gestão Tecnológica',
    url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=070002013015',
    observacao_usuario: 'Processo prioritário para análise. Verificar documentos relacionados ao projeto de modernização.',
    hash_conteudo: 'abc123def456',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-27T09:15:00Z',
    total_documentos: 8,
    documentos_analisados: 6,
    custo_total_llm: 23.45,
    localizacao_atual: 'SEFAZ/COGET - Coordenação de Gestão Tecnológica',
  };

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Processo>>({});
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  // Dados mock de documentos
  React.useEffect(() => {
    const documentosMock: Documento[] = [
      {
        id: 1,
        processo_id: processoId,
        numero_documento: 'DOC-2024001234',
        url_documento: 'https://sei.rj.gov.br/sei/controlador.php?acao=documento_visualizar&id_documento=2024001234',
        tipo: 'Memorando',
        data_documento: '2024-07-16',
        data_inclusao: '2024-07-16',
        unidade: 'SEFAZ/COGET',
        assunto_documento: 'Solicitação de orçamento para equipamentos de TI',
        arquivo_path: '/uploads/doc_2024001234.pdf',
        downloaded: true,
        detalhamento_status: 'concluido',
        detalhamento_modelo: 'gpt-4-turbo',
        detalhamento_tokens: 1250,
        detalhamento_data: '2024-07-17T10:30:00Z',
        created_at: '2024-07-16T14:20:00Z',
        updated_at: '2024-07-17T10:30:00Z',
      },
      {
        id: 2,
        processo_id: processoId,
        numero_documento: 'DOC-2024001235',
        url_documento: 'https://sei.rj.gov.br/sei/controlador.php?acao=documento_visualizar&id_documento=2024001235',
        tipo: 'Relatório Técnico',
        data_documento: '2024-07-18',
        data_inclusao: '2024-07-18',
        unidade: 'SEFAZ/DTI',
        assunto_documento: 'Análise técnica de viabilidade do projeto',
        arquivo_path: '/uploads/doc_2024001235.pdf',
        downloaded: true,
        detalhamento_status: 'concluido',
        detalhamento_modelo: 'gpt-4-turbo',
        detalhamento_tokens: 2100,
        detalhamento_data: '2024-07-19T09:15:00Z',
        created_at: '2024-07-18T11:45:00Z',
        updated_at: '2024-07-19T09:15:00Z',
      },
      {
        id: 3,
        processo_id: processoId,
        numero_documento: 'DOC-2024001236',
        url_documento: 'https://sei.rj.gov.br/sei/controlador.php?acao=documento_visualizar&id_documento=2024001236',
        tipo: 'Planilha Orçamentária',
        data_documento: '2024-07-20',
        data_inclusao: '2024-07-20',
        unidade: 'SEFAZ/COGET',
        arquivo_path: '/uploads/doc_2024001236.xlsx',
        downloaded: false,
        detalhamento_status: 'pendente',
        created_at: '2024-07-20T15:30:00Z',
        updated_at: '2024-07-20T15:30:00Z',
      },
    ];

    const andamentosMock: Andamento[] = [
      {
        id: 1,
        processo_id: processoId,
        data_hora: '2024-07-16T08:30:00Z',
        unidade: 'SEFAZ/PROTOCOLO',
        descricao: 'Processo autuado e distribuído para análise',
        localizacao_atual: false,
        created_at: '2024-07-16T08:30:00Z',
      },
      {
        id: 2,
        processo_id: processoId,
        data_hora: '2024-07-16T14:20:00Z',
        unidade: 'SEFAZ/COGET',
        descricao: 'Recebido para análise técnica inicial',
        localizacao_atual: false,
        created_at: '2024-07-16T14:20:00Z',
      },
      {
        id: 3,
        processo_id: processoId,
        data_hora: '2024-07-18T11:45:00Z',
        unidade: 'SEFAZ/DTI',
        descricao: 'Encaminhado para avaliação técnica especializada',
        localizacao_atual: false,
        created_at: '2024-07-18T11:45:00Z',
      },
      {
        id: 4,
        processo_id: processoId,
        data_hora: '2024-07-27T09:15:00Z',
        unidade: 'SEFAZ/COGET',
        descricao: 'Retornado com relatório técnico para consolidação',
        localizacao_atual: true,
        created_at: '2024-07-27T09:15:00Z',
      },
    ];

    setDocumentos(documentosMock);
    setAndamentos(andamentosMock);
  }, [processoId]);

  const handleEdit = () => {
    if (processo) {
      setEditFormData(processo);
      setEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // await apiService.updateProcesso(processoId, editFormData);
      console.log('Salvando:', editFormData);
      setEditDialog(false);
      // refetch();
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // await apiService.deleteProcesso(processoId);
      console.log('Excluindo processo:', processoId);
      setDeleteDialog(false);
      navigate('/processos');
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
    }
  };

  const handleAnalyzeDocument = async (documentoId: number) => {
    try {
      // await apiService.analisarDocumento(documentoId);
      console.log('Analisando documento:', documentoId);
      // Simular análise
      setDocumentos(prev => prev.map(doc => 
        doc.id === documentoId 
          ? { ...doc, detalhamento_status: 'processando' as StatusType }
          : doc
      ));
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
    }
  };

  const handleViewDocument = (documentoId: number) => {
    navigate(`/documentos/${documentoId}`);
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
    if (tipo.includes('Administrativo') || tipo.includes('PAD')) return 'primary';
    if (tipo.includes('Licitação') || tipo.includes('Pregão')) return 'success';
    if (tipo.includes('Legislativa') || tipo.includes('Lei')) return 'info';
    if (tipo.includes('Contratual') || tipo.includes('Revisão')) return 'warning';
    if (tipo.includes('Improbidade') || tipo.includes('Ação')) return 'error';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !processo) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar detalhes do processo. {error?.message}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/processos')}>
          Voltar para Lista
        </Button>
      </Box>
    );
  }

  const estatisticasDocumentos = {
    total: documentos.length,
    analisados: documentos.filter(d => d.detalhamento_status === 'concluido').length,
    pendentes: documentos.filter(d => d.detalhamento_status === 'pendente').length,
    erro: documentos.filter(d => d.detalhamento_status === 'erro').length,
    custoTotal: documentos.reduce((acc, d) => acc + (d.detalhamento_tokens ? d.detalhamento_tokens * 0.01 : 0), 0),
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link color="inherit" href="/processos" onClick={(e) => { e.preventDefault(); navigate('/processos'); }}>
              Processos
            </Link>
            <Typography color="text.primary">
              {processo.numero}
            </Typography>
          </Breadcrumbs>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/processos')}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1">
              {processo.numero}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialog(true)}
          >
            Excluir
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            href={processo.url_processo}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir no SEI
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Informações Principais */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações Gerais
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assignment color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Número SEI:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {processo.numero}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Category color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Chip
                    label={processo.tipo}
                    color={getTipoColor(processo.tipo) as any}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarToday color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Data Geração:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(processo.data_geracao)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Update color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Última Atualização:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(processo.updated_at)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Interessados:
                  </Typography>
                  <Typography variant="body1">
                    {processo.interessados}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocationOn color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Localização Atual:
                  </Typography>
                  <Chip
                    label={processo.localizacao_atual}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Grid>

              {processo.observacao_usuario && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <Comment color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Observação do Usuário:
                      </Typography>
                      <Typography variant="body1">
                        {processo.observacao_usuario}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Andamentos do Processo */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Histórico de Andamentos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {andamentos.map((andamento, index) => (
                <ListItem key={andamento.id} sx={{ 
                  bgcolor: andamento.localizacao_atual ? 'primary.50' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                  border: andamento.localizacao_atual ? '1px solid' : 'none',
                  borderColor: 'primary.200'
                }}>
                  <ListItemIcon>
                    <Timeline color={andamento.localizacao_atual ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {andamento.descricao}
                        </Typography>
                        {andamento.localizacao_atual && (
                          <Chip label="Localização Atual" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>{andamento.unidade}</strong> • {formatDate(andamento.data_hora)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Estatísticas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estatísticas de Documentos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="h4" color="primary">
                      {estatisticasDocumentos.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Docs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="h4" color="success.main">
                      {estatisticasDocumentos.analisados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analisados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="h4" color="warning.main">
                      {estatisticasDocumentos.pendentes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pendentes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="h4" color="error.main">
                      {estatisticasDocumentos.erro}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Com Erro
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="h5" color="secondary.main">
                      {formatCurrency(estatisticasDocumentos.custoTotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Custo Total LLM
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Ações Rápidas */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ações Rápidas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={1}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CloudDownload />}
                onClick={() => console.log('Sincronizar com SEI')}
              >
                Sincronizar com SEI
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Analytics />}
                onClick={() => console.log('Analisar todos documentos')}
              >
                Analisar Todos Documentos
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FileDownload />}
                onClick={() => console.log('Download todos documentos')}
              >
                Download Todos Documentos
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Lista de Documentos */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Documentos ({documentos.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CloudDownload />}
                onClick={() => console.log('Atualizar documentos')}
                disabled={loadingDocumentos}
              >
                Atualizar
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loadingDocumentos ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : documentos.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum documento encontrado para este processo.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {documentos.map((documento) => (
                  <Grid item xs={12} md={6} lg={4} key={documento.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {getStatusIcon(documento.detalhamento_status)}
                          <Typography variant="subtitle2" noWrap>
                            {documento.numero_documento}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Tipo:</strong> {documento.tipo}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Unidade:</strong> {documento.unidade}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Data:</strong> {formatDate(documento.data_documento || documento.created_at)}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <StatusChip status={documento.detalhamento_status} size="small" />
                          {documento.detalhamento_tokens && (
                            <Typography variant="caption" color="text.secondary">
                              {documento.detalhamento_tokens} tokens
                            </Typography>
                          )}
                        </Box>

                        {documento.assunto_documento && (
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            mt: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            <strong>Assunto:</strong> {documento.assunto_documento}
                          </Typography>
                        )}
                      </CardContent>
                      
                      <CardActions>
                        <Tooltip title="Visualizar">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDocument(documento.id)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {documento.url_documento && (
                          <Tooltip title="Abrir no SEI">
                            <IconButton
                              size="small"
                              component="a"
                              href={documento.url_documento}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {documento.detalhamento_status === 'pendente' && (
                          <Tooltip title="Analisar com IA">
                            <IconButton
                              size="small"
                              onClick={() => handleAnalyzeDocument(documento.id)}
                            >
                              <Psychology />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <FileDownload />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Edição */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Processo</DialogTitle>
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
                label="Interessados"
                value={editFormData.interessados || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, interessados: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data Geração"
                type="date"
                value={editFormData.data_geracao || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, data_geracao: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="URL do Processo"
                value={editFormData.url_processo || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, url_processo: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observação do Usuário"
                value={editFormData.observacao_usuario || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, observacao_usuario: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o processo <strong>{processo.numero}</strong>?
            Esta ação não pode ser desfeita e excluirá também todos os documentos e andamentos relacionados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcessoDetails; 