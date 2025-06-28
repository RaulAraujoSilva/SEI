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
import { useProcesso, useDocumentos, useAndamentos, useUpdateProcesso, useDeleteProcesso, useAnalisarDocumento } from '../hooks/useApi';
import { apiService } from '../services/api';
import StatusChip from '../components/StatusChip';
import { formatDate, formatCurrency } from '../utils';
import { Processo, Documento, Andamento, StatusType } from '../types';

const ProcessoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const processoId = parseInt(id || '0');
  
  // Usar hooks reais da API
  const { data: processo, isLoading, error, refetch } = useProcesso(processoId);
  const { data: documentosResponse, isLoading: loadingDocumentos } = useDocumentos({ processo_id: processoId });
  const { data: andamentosResponse, isLoading: loadingAndamentos, refetch: refetchAndamentos } = useAndamentos(processoId);
  const updateProcessoMutation = useUpdateProcesso();
  const deleteProcessoMutation = useDeleteProcesso();
  const analisarDocumentoMutation = useAnalisarDocumento();

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Processo>>({});

  // Extrair dados das respostas paginadas
  const documentos = documentosResponse?.items || [];
  const andamentos = andamentosResponse?.items || [];

  const handleEdit = () => {
    if (processo) {
      setEditFormData(processo);
      setEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateProcessoMutation.mutateAsync({ 
        id: processoId, 
        data: editFormData 
      });
      setEditDialog(false);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProcessoMutation.mutateAsync(processoId);
      setDeleteDialog(false);
      navigate('/processos');
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
    }
  };

  const handleAnalyzeDocument = async (documentoId: number) => {
    try {
      await analisarDocumentoMutation.mutateAsync(documentoId);
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
            disabled={updateProcessoMutation.isPending}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialog(true)}
            disabled={deleteProcessoMutation.isPending}
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

              <Grid item xs={12}>
                <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                  <Description color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Assunto:
                    </Typography>
                    <Typography variant="body1">
                      {processo.assunto}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarToday color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Data Autuação:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(processo.data_autuacao)}
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
                    Interessado:
                  </Typography>
                  <Typography variant="body1">
                    {processo.interessado}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Business color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Órgão Autuador:
                  </Typography>
                  <Typography variant="body1">
                    {processo.orgao_autuador}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocationOn color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Situação:
                  </Typography>
                  <Chip
                    label={processo.situacao}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Grid>
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
                  bgcolor: index === andamentos.length - 1 ? 'primary.50' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                  border: index === andamentos.length - 1 ? '1px solid' : 'none',
                  borderColor: 'primary.200'
                }}>
                  <ListItemIcon>
                    <Timeline color={index === andamentos.length - 1 ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {andamento.descricao}
                        </Typography>
                        {index === andamentos.length - 1 && (
                          <Chip label="Localização Atual" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>{andamento.unidade}</strong> • {formatDate(andamento.data_andamento)}
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
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {estatisticasDocumentos.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {estatisticasDocumentos.analisados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analisados
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {estatisticasDocumentos.pendentes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {estatisticasDocumentos.erro}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Com Erro
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Lista de Documentos */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Documentos ({documentos.length})
              </Typography>
              <Button
                size="small"
                onClick={() => navigate(`/processos/${processoId}/documentos`)}
              >
                Ver Todos
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loadingDocumentos ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : documentos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                Nenhum documento encontrado
              </Typography>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {documentos.slice(0, 5).map((documento) => (
                  <ListItem
                    key={documento.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={documento.numero}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {documento.tipo}
                          </Typography>
                          <Box mt={0.5}>
                            <StatusChip 
                              status={documento.detalhamento_status as StatusType || 'pendente'} 
                              size="small" 
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(documento.id)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {documento.detalhamento_status === 'pendente' && (
                        <IconButton
                          size="small"
                          onClick={() => handleAnalyzeDocument(documento.id)}
                          disabled={analisarDocumentoMutation.isPending}
                        >
                          <Psychology fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
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
                label="Assunto"
                value={editFormData.assunto || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, assunto: e.target.value }))}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Interessado"
                value={editFormData.interessado || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, interessado: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Situação"
                value={editFormData.situacao || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, situacao: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Órgão Autuador"
                value={editFormData.orgao_autuador || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, orgao_autuador: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="URL do Processo"
                value={editFormData.url_processo || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, url_processo: e.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={updateProcessoMutation.isPending}
          >
            {updateProcessoMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o processo <strong>{processo.numero}</strong>?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteProcessoMutation.isPending}
          >
            {deleteProcessoMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcessoDetails; 