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
  Avatar
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

// Interfaces
interface Documento {
  id: number;
  numero: string;
  tipo: string;
  titulo: string;
  processo_id: number;
  processo_numero: string;
  unidade_geradora: string;
  data_criacao: string;
  data_modificacao?: string;
  tamanho_arquivo?: number;
  status_download: 'pendente' | 'baixando' | 'concluido' | 'erro';
  status_analise?: 'pendente' | 'analisando' | 'concluido' | 'erro';
  tem_conteudo_extraido: boolean;
  assunto_gerado?: string;
  nivel_confidencialidade: 'publico' | 'restrito' | 'confidencial';
  tags?: string[];
  favorito?: boolean;
  visualizacoes: number;
}

interface FiltrosDocumento {
  busca: string;
  tipo: string;
  status_download: string;
  status_analise: string;
  unidade: string;
  confidencialidade: string;
  data_inicio: string;
  data_fim: string;
  apenas_favoritos: boolean;
  com_analise: boolean;
}

interface EstatisticasDocumento {
  total: number;
  por_tipo: { [key: string]: number };
  por_status: { [key: string]: number };
  com_analise: number;
  favoritos: number;
  tamanho_total: string;
}

const DocumentosList: React.FC = () => {
  const navigate = useNavigate();

  // Estados principais
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosDocumento>({
    busca: '',
    tipo: '',
    status_download: '',
    status_analise: '',
    unidade: '',
    confidencialidade: '',
    data_inicio: '',
    data_fim: '',
    apenas_favoritos: false,
    com_analise: false
  });

  // Estados da interface
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [drawerFiltros, setDrawerFiltros] = useState(false);
  const [dialogDownload, setDialogDownload] = useState(false);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<Documento | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [estatisticas, setEstatisticas] = useState<EstatisticasDocumento | null>(null);

  // Dados mock para demonstração
  const documentosMock: Documento[] = [
    {
      id: 1,
      numero: 'DOC-2024001234',
      tipo: 'Memorando',
      titulo: 'Memorando Interno - Solicitação Orçamentária',
      processo_id: 1,
      processo_numero: 'SEI-070002/013015/2024',
      unidade_geradora: 'SEFAZ/COGET',
      data_criacao: '2024-01-15T09:30:00',
      data_modificacao: '2024-01-16T14:20:00',
      tamanho_arquivo: 245760,
      status_download: 'concluido',
      status_analise: 'concluido',
      tem_conteudo_extraido: true,
      assunto_gerado: 'Solicitação de recursos orçamentários para modernização tecnológica',
      nivel_confidencialidade: 'restrito',
      tags: ['orçamento', 'tecnologia', 'SEFAZ'],
      favorito: true,
      visualizacoes: 23
    },
    {
      id: 2,
      numero: 'DOC-2024001235',
      tipo: 'Ofício',
      titulo: 'Ofício Circular - Orientações Contábeis',
      processo_id: 2,
      processo_numero: 'SEI-070002/013016/2024',
      unidade_geradora: 'SEFAZ/CONTADORIA',
      data_criacao: '2024-01-16T11:15:00',
      tamanho_arquivo: 189440,
      status_download: 'concluido',
      status_analise: 'pendente',
      tem_conteudo_extraido: true,
      nivel_confidencialidade: 'publico',
      tags: ['contabilidade', 'orientação'],
      favorito: false,
      visualizacoes: 8
    },
    {
      id: 3,
      numero: 'DOC-2024001236',
      tipo: 'Parecer Técnico',
      titulo: 'Parecer sobre Regularidade Fiscal',
      processo_id: 3,
      processo_numero: 'SEI-070002/013017/2024',
      unidade_geradora: 'SEFAZ/AUDITORIA',
      data_criacao: '2024-01-17T15:45:00',
      tamanho_arquivo: 512000,
      status_download: 'baixando',
      status_analise: 'pendente',
      tem_conteudo_extraido: false,
      nivel_confidencialidade: 'confidencial',
      tags: ['auditoria', 'fiscal'],
      favorito: false,
      visualizacoes: 5
    },
    {
      id: 4,
      numero: 'DOC-2024001237',
      tipo: 'Despacho',
      titulo: 'Despacho de Encaminhamento',
      processo_id: 1,
      processo_numero: 'SEI-070002/013015/2024',
      unidade_geradora: 'SEFAZ/GABINETE',
      data_criacao: '2024-01-18T08:20:00',
      tamanho_arquivo: 98304,
      status_download: 'concluido',
      status_analise: 'concluido',
      tem_conteudo_extraido: true,
      assunto_gerado: 'Encaminhamento para análise técnica e aprovação',
      nivel_confidencialidade: 'restrito',
      tags: ['despacho', 'encaminhamento'],
      favorito: false,
      visualizacoes: 12
    },
    {
      id: 5,
      numero: 'DOC-2024001238',
      tipo: 'Relatório',
      titulo: 'Relatório Mensal de Atividades',
      processo_id: 4,
      processo_numero: 'SEI-070002/013018/2024',
      unidade_geradora: 'SEFAZ/COORDENACAO',
      data_criacao: '2024-01-19T16:30:00',
      tamanho_arquivo: 1048576,
      status_download: 'erro',
      status_analise: 'pendente',
      tem_conteudo_extraido: false,
      nivel_confidencialidade: 'publico',
      tags: ['relatório', 'mensal'],
      favorito: true,
      visualizacoes: 31
    },
    {
      id: 6,
      numero: 'DOC-2024001239',
      tipo: 'Ata',
      titulo: 'Ata da Reunião de Planejamento',
      processo_id: 5,
      processo_numero: 'SEI-070002/013019/2024',
      unidade_geradora: 'SEFAZ/PLANEJAMENTO',
      data_criacao: '2024-01-20T10:00:00',
      tamanho_arquivo: 156672,
      status_download: 'concluido',
      status_analise: 'analisando',
      tem_conteudo_extraido: true,
      nivel_confidencialidade: 'restrito',
      tags: ['ata', 'reunião', 'planejamento'],
      favorito: false,
      visualizacoes: 7
    }
  ];

  const estatisticasMock: EstatisticasDocumento = {
    total: 6,
    por_tipo: {
      'Memorando': 1,
      'Ofício': 1,
      'Parecer Técnico': 1,
      'Despacho': 1,
      'Relatório': 1,
      'Ata': 1
    },
    por_status: {
      'concluido': 4,
      'baixando': 1,
      'erro': 1
    },
    com_analise: 3,
    favoritos: 2,
    tamanho_total: '2.1 MB'
  };

  // Efeitos
  useEffect(() => {
    carregarDocumentos();
  }, []);

  // Funções de carregamento
  const carregarDocumentos = async () => {
    try {
      setLoading(true);
      // Simular chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDocumentos(documentosMock);
      setEstatisticas(estatisticasMock);
    } catch (err) {
      setError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  // Funções de filtro
  const documentosFiltrados = documentos.filter(doc => {
    if (filtros.busca && !doc.titulo.toLowerCase().includes(filtros.busca.toLowerCase()) && 
        !doc.numero.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
    if (filtros.tipo && doc.tipo !== filtros.tipo) return false;
    if (filtros.status_download && doc.status_download !== filtros.status_download) return false;
    if (filtros.status_analise && doc.status_analise !== filtros.status_analise) return false;
    if (filtros.unidade && doc.unidade_geradora !== filtros.unidade) return false;
    if (filtros.confidencialidade && doc.nivel_confidencialidade !== filtros.confidencialidade) return false;
    if (filtros.apenas_favoritos && !doc.favorito) return false;
    if (filtros.com_analise && !doc.tem_conteudo_extraido) return false;
    return true;
  });

  const documentosPaginados = documentosFiltrados.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(documentosFiltrados.length / itemsPerPage);

  // Funções de ação
  const toggleFavorito = (id: number) => {
    setDocumentos(docs => docs.map(doc => 
      doc.id === id ? { ...doc, favorito: !doc.favorito } : doc
    ));
    setSnackbar({
      open: true,
      message: 'Favorito atualizado com sucesso',
      severity: 'success'
    });
  };

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

  const formatarTamanho = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'success';
      case 'baixando': case 'analisando': return 'warning';
      case 'erro': return 'error';
      default: return 'default';
    }
  };

  const getConfidencialidadeColor = (nivel: string) => {
    switch (nivel) {
      case 'publico': return 'success';
      case 'restrito': return 'warning';
      case 'confidencial': return 'error';
      default: return 'default';
    }
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
            <IconButton size="small" onClick={() => toggleFavorito(documento.id)}>
              {documento.favorito ? 
                <Star color="warning" fontSize="small" /> : 
                <StarBorder fontSize="small" />
              }
            </IconButton>
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
            {documento.titulo}
          </Typography>

          <Box mb={2}>
            <Chip 
              label={documento.tipo} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
            <Chip 
              label={documento.status_download} 
              size="small" 
              color={getStatusColor(documento.status_download) as any}
              sx={{ mr: 1, mb: 1 }}
            />
            <Chip 
              label={documento.nivel_confidencialidade} 
              size="small" 
              color={getConfidencialidadeColor(documento.nivel_confidencialidade) as any}
              variant="outlined"
              sx={{ mb: 1 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Business fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            {documento.unidade_geradora}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Schedule fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            {formatarData(documento.data_criacao)}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tamanho: {formatarTamanho(documento.tamanho_arquivo)} • {documento.visualizacoes} visualizações
          </Typography>

          {documento.assunto_gerado && (
            <Typography variant="body2" sx={{ 
              fontStyle: 'italic',
              color: 'text.secondary',
              mt: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              "{documento.assunto_gerado}"
            </Typography>
          )}

          {documento.tags && documento.tags.length > 0 && (
            <Box mt={1}>
              {documento.tags.slice(0, 3).map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
        </CardContent>

        <Box p={2} pt={0}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                size="small"
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
                startIcon={<Download />}
                onClick={() => baixarDocumento(documento)}
                disabled={documento.status_download === 'baixando'}
              >
                {documento.status_download === 'baixando' ? 'Baixando...' : 'Download'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Grid>
  );

  const renderDocumentoList = (documento: Documento) => (
    <Card key={documento.id} sx={{ mb: 1 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <Description fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{documento.numero}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {documento.titulo}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Chip 
              label={documento.tipo} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="body2">{documento.unidade_geradora}</Typography>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="body2">{formatarData(documento.data_criacao)}</Typography>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1}>
              <IconButton size="small" onClick={() => toggleFavorito(documento.id)}>
                {documento.favorito ? 
                  <Star color="warning" fontSize="small" /> : 
                  <StarBorder fontSize="small" />
                }
              </IconButton>
              <IconButton size="small" onClick={() => visualizarDocumento(documento.id)}>
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => baixarDocumento(documento)}>
                <Download fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Documentos
        </Typography>
        <LinearProgress />
        <Box mt={2}>
          <Typography>Carregando documentos...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Documentos
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Refresh />}
            onClick={carregarDocumentos}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            startIcon={<FilterList />}
            onClick={() => setDrawerFiltros(true)}
          >
            Filtros
          </Button>
          <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
          </IconButton>
        </Box>
      </Box>

      {/* Estatísticas */}
      {estatisticas && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {estatisticas.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Documentos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {estatisticas.com_analise}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Com Análise IA
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {estatisticas.favoritos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Favoritos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {estatisticas.tamanho_total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tamanho Total
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Busca rápida */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Buscar documentos por título, número ou conteúdo..."
          value={filtros.busca}
          onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      {/* Lista de documentos */}
      {documentosFiltrados.length === 0 ? (
        <Alert severity="info">
          Nenhum documento encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {documentosPaginados.map(renderDocumentoCard)}
            </Grid>
          ) : (
            <Box>
              {documentosPaginados.map(renderDocumentoList)}
            </Box>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Filtros Avançados</Typography>
            <IconButton onClick={() => setDrawerFiltros(false)}>
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Memorando">Memorando</MenuItem>
                <MenuItem value="Ofício">Ofício</MenuItem>
                <MenuItem value="Parecer Técnico">Parecer Técnico</MenuItem>
                <MenuItem value="Despacho">Despacho</MenuItem>
                <MenuItem value="Relatório">Relatório</MenuItem>
                <MenuItem value="Ata">Ata</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status Download</InputLabel>
              <Select
                value={filtros.status_download}
                onChange={(e) => setFiltros({ ...filtros, status_download: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendente">Pendente</MenuItem>
                <MenuItem value="baixando">Baixando</MenuItem>
                <MenuItem value="concluido">Concluído</MenuItem>
                <MenuItem value="erro">Erro</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status Análise</InputLabel>
              <Select
                value={filtros.status_analise}
                onChange={(e) => setFiltros({ ...filtros, status_analise: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendente">Pendente</MenuItem>
                <MenuItem value="analisando">Analisando</MenuItem>
                <MenuItem value="concluido">Concluído</MenuItem>
                <MenuItem value="erro">Erro</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Nível de Confidencialidade</InputLabel>
              <Select
                value={filtros.confidencialidade}
                onChange={(e) => setFiltros({ ...filtros, confidencialidade: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="publico">Público</MenuItem>
                <MenuItem value="restrito">Restrito</MenuItem>
                <MenuItem value="confidencial">Confidencial</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={filtros.apenas_favoritos}
                  onChange={(e) => setFiltros({ ...filtros, apenas_favoritos: e.target.checked })}
                />
              }
              label="Apenas Favoritos"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={filtros.com_analise}
                  onChange={(e) => setFiltros({ ...filtros, com_analise: e.target.checked })}
                />
              }
              label="Com Análise IA"
            />

            <Divider />

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFiltros({
                busca: '',
                tipo: '',
                status_download: '',
                status_analise: '',
                unidade: '',
                confidencialidade: '',
                data_inicio: '',
                data_fim: '',
                apenas_favoritos: false,
                com_analise: false
              })}
            >
              Limpar Filtros
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Dialog de Download */}
      <Dialog open={dialogDownload} onClose={() => setDialogDownload(false)}>
        <DialogTitle>Confirmar Download</DialogTitle>
        <DialogContent>
          {documentoSelecionado && (
            <Box>
              <Typography gutterBottom>
                Deseja baixar o documento <strong>{documentoSelecionado.numero}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documentoSelecionado.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Tamanho: {formatarTamanho(documentoSelecionado.tamanho_arquivo)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDownload(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmarDownload} 
            variant="contained"
            startIcon={<Download />}
          >
            Baixar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DocumentosList; 