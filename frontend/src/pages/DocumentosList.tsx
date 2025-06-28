import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Badge,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  ViewList,
  ViewModule,
  Download,
  Visibility,
  Analytics,
  Description,
  PictureAsPdf,
  InsertDriveFile,
  CloudDownload,
  Schedule,
  Person,
  Business,
  Category,
  TrendingUp,
  ExpandMore,
  Close,
  Refresh,
  GetApp,
  Share,
  Star,
  StarBorder,
  MoreVert
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDocumentos, useEstatisticasDocumentos } from '../hooks/useApi';
import { DocumentoFilters, Documento, EstatisticasDocumentos } from '../types';
import { formatDate, formatFileSize } from '../utils';
import StatusChip from '../components/StatusChip';

const DocumentosList: React.FC = () => {
  const navigate = useNavigate();

  // Estados principais
  const [filtros, setFiltros] = useState<DocumentoFilters>({
    q: '',
    tipo: '',
    status_analise: '',
    data_inicio: '',
    data_fim: '',
    page: 1,
    size: 12,
  });

  // Estados da interface
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [drawerFiltros, setDrawerFiltros] = useState(false);
  const [dialogDownload, setDialogDownload] = useState(false);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<Documento | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Usar hooks reais da API
  const { data: documentosResponse, isLoading, error } = useDocumentos(filtros);
  const { data: estatisticas } = useEstatisticasDocumentos();

  // Extrair dados da resposta
  const documentos = documentosResponse?.items || [];
  const totalPages = documentosResponse?.pages || 1;

  // Funções de filtro
  const handleFiltroChange = (campo: keyof DocumentoFilters, valor: any) => {
    setFiltros(prev => ({ 
      ...prev, 
      [campo]: valor,
      page: 1 // Reset para primeira página ao mudar filtros
    }));
  };

  const clearFiltros = () => {
    setFiltros({
      q: '',
      tipo: '',
      status_analise: '',
      data_inicio: '',
      data_fim: '',
      page: 1,
      size: 12,
    });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFiltros(prev => ({ ...prev, page }));
  };

  // Funções de ação
  const baixarDocumento = (documento: Documento) => {
    setDocumentoSelecionado(documento);
    setDialogDownload(true);
  };

  const confirmarDownload = () => {
    if (documentoSelecionado) {
      // Simular download
      setSnackbar({
        open: true,
        message: `Download de ${documentoSelecionado.numero} iniciado`,
        severity: 'success'
      });
    }
    setDialogDownload(false);
    setDocumentoSelecionado(null);
  };

  const visualizarDocumento = (id: number) => {
    navigate(`/documentos/${id}`);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'concluido': return 'success';
      case 'processando': return 'warning';
      case 'erro': return 'error';
      default: return 'default';
    }
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo.toLowerCase().includes('pdf')) return <PictureAsPdf />;
    return <InsertDriveFile />;
  };

  const renderDocumentoCard = (documento: Documento) => (
    <Grid item xs={12} sm={6} md={4} key={documento.id}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <Description fontSize="small" />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {documento.numero}
              </Typography>
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ 
            fontSize: '1rem',
            lineHeight: 1.2,
            height: '2.4em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {documento.descricao || documento.tipo}
          </Typography>

          <Box mb={2}>
            <Chip 
              label={documento.tipo} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
            {documento.detalhamento_status && (
              <StatusChip 
                status={documento.detalhamento_status as any}
                size="small"
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Schedule fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            {formatDate(documento.data_documento)}
          </Typography>

          {documento.tamanho_arquivo && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tamanho: {formatFileSize(documento.tamanho_arquivo)}
            </Typography>
          )}

          {documento.detalhamento_texto && (
            <Typography variant="body2" sx={{ 
              fontStyle: 'italic',
              color: 'text.secondary',
              mt: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              "{documento.detalhamento_texto.substring(0, 100)}..."
            </Typography>
          )}
        </CardContent>

        <Box p={2} pt={0}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => visualizarDocumento(documento.id)}
              >
                Ver
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<Download />}
                onClick={() => baixarDocumento(documento)}
              >
                Download
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Grid>
  );

  const renderDocumentoList = (documento: Documento) => (
    <Paper key={documento.id} sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Description />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {documento.numero}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documento.tipo}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2">
            {documento.descricao || 'Sem descrição'}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(documento.data_documento)}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          {documento.detalhamento_status && (
            <StatusChip 
              status={documento.detalhamento_status as any}
              size="small"
            />
          )}
        </Grid>
        
        <Grid item xs={12} sm={12} md={1}>
          <Box display="flex" gap={1}>
            <IconButton 
              size="small" 
              onClick={() => visualizarDocumento(documento.id)}
            >
              <Visibility />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => baixarDocumento(documento)}
            >
              <Download />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar documentos: {error.message}
        </Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            Documentos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {documentosResponse?.total || 0} documentos encontrados
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setDrawerFiltros(true)}
          >
            Filtros
          </Button>
          <IconButton
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
          </IconButton>
        </Stack>
      </Box>

      {/* Estatísticas */}
      {estatisticas && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Estatísticas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main">
                  {estatisticas.total_documentos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {estatisticas.documentos_analisados}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analisados
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {estatisticas.documentos_nao_analisados}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendentes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {estatisticas.tamanho_medio_arquivo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamanho Médio
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Busca Rápida */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar documentos..."
              value={filtros.q || ''}
              onChange={(e) => handleFiltroChange('q', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filtros.tipo || ''}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Memorando">Memorando</MenuItem>
                <MenuItem value="Ofício">Ofício</MenuItem>
                <MenuItem value="Relatório">Relatório</MenuItem>
                <MenuItem value="Parecer">Parecer</MenuItem>
                <MenuItem value="Despacho">Despacho</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filtros.status_analise || ''}
                onChange={(e) => handleFiltroChange('status_analise', e.target.value)}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendente">Pendente</MenuItem>
                <MenuItem value="processando">Processando</MenuItem>
                <MenuItem value="concluido">Concluído</MenuItem>
                <MenuItem value="erro">Erro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading */}
      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Lista de Documentos */}
      {!isLoading && (
        <>
          {documentos.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum documento encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tente ajustar os filtros ou remover alguns critérios de busca
              </Typography>
              <Button
                variant="outlined"
                onClick={clearFiltros}
                sx={{ mt: 2 }}
              >
                Limpar Filtros
              </Button>
            </Paper>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <Grid container spacing={3}>
                  {documentos.map(renderDocumentoCard)}
                </Grid>
              ) : (
                <Box>
                  {documentos.map(renderDocumentoList)}
                </Box>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={filtros.page || 1}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Drawer de Filtros */}
      <Drawer
        anchor="right"
        open={drawerFiltros}
        onClose={() => setDrawerFiltros(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h6">
              Filtros Avançados
            </Typography>
            <IconButton onClick={() => setDrawerFiltros(false)}>
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            <TextField
              label="Busca no conteúdo"
              value={filtros.q || ''}
              onChange={(e) => handleFiltroChange('q', e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={filtros.tipo || ''}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                label="Tipo de Documento"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Memorando">Memorando</MenuItem>
                <MenuItem value="Ofício">Ofício</MenuItem>
                <MenuItem value="Relatório">Relatório</MenuItem>
                <MenuItem value="Parecer">Parecer</MenuItem>
                <MenuItem value="Despacho">Despacho</MenuItem>
                <MenuItem value="Ata">Ata</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status da Análise</InputLabel>
              <Select
                value={filtros.status_analise || ''}
                onChange={(e) => handleFiltroChange('status_analise', e.target.value)}
                label="Status da Análise"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendente">Pendente</MenuItem>
                <MenuItem value="processando">Processando</MenuItem>
                <MenuItem value="concluido">Concluído</MenuItem>
                <MenuItem value="erro">Erro</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Data Início"
              type="date"
              value={filtros.data_inicio || ''}
              onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Data Fim"
              type="date"
              value={filtros.data_fim || ''}
              onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Divider />

            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={clearFiltros}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setDrawerFiltros(false)}
              >
                Aplicar
              </Button>
            </Box>
          </Stack>
        </Box>
      </Drawer>

      {/* Dialog de Download */}
      <Dialog open={dialogDownload} onClose={() => setDialogDownload(false)}>
        <DialogTitle>Confirmar Download</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja baixar o documento <strong>{documentoSelecionado?.numero}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDownload(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmarDownload} variant="contained">
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentosList; 