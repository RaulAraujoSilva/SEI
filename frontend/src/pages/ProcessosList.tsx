import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { Add, Search, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProcessos } from '../hooks/useApi';
import { ProcessoFilters } from '../types';

const ProcessosList: React.FC = () => {
  const navigate = useNavigate();
  
  // ============================================================================
  // ESTADOS DE FILTRO E PAGINAÇÃO
  // ============================================================================
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState<ProcessoFilters>({
    numero: '',
    tipo: '',
    interessado: '',
    size: 12,
    page: 1,
  });

  // ============================================================================
  // DADOS REAIS DA API (substituindo mock)
  // ============================================================================
  const { data: processosData, isLoading, error } = useProcessos({
    ...filtros,
    page: page,
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleSearch = (value: string) => {
    setFiltros(prev => ({ ...prev, numero: value }));
    setPage(1); // Reset para primeira página
  };

  const handleFilterChange = (field: keyof ProcessoFilters, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const visualizarProcesso = (id: number) => {
    navigate(`/processos/${id}`);
  };

  const novoProcesso = () => {
    navigate('/processos/novo');
  };

  // ============================================================================
  // DADOS PROCESSADOS
  // ============================================================================
  const processos = processosData?.items || [];
  const totalProcessos = processosData?.total || 0;
  const totalPages = Math.ceil(totalProcessos / (filtros.size || 12));

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Processos</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={novoProcesso}>
            Novo Processo
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Carregando processos da API...
        </Alert>

        {/* Skeleton para filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={56} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={56} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={56} />
          </Grid>
        </Grid>

        {/* Skeleton para cards */}
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="rectangular" height={32} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Processos</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={novoProcesso}>
            Novo Processo
          </Button>
        </Box>

        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Erro ao carregar processos:</strong> {error.message || 'Erro desconhecido'}
          <br />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Verifique se o backend está rodando em http://localhost:8000
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Processos</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={novoProcesso}
          sx={{ minWidth: 150 }}
        >
          Novo Processo
        </Button>
      </Box>

      {/* Status da API */}
      <Alert severity={processos.length > 0 ? 'success' : 'info'} sx={{ mb: 3 }}>
        {processos.length > 0 ? (
          <>
            <strong>✅ {totalProcessos} processos</strong> carregados da API. 
            {filtros.numero && (
              <span> Filtrados por: "{filtros.numero}"</span>
            )}
          </>
        ) : (
          <>
            <strong>📋 Nenhum processo encontrado.</strong> 
            Use o botão "Novo Processo" para adicionar processos do SEI-RJ.
          </>
        )}
      </Alert>

      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Buscar por número do processo..."
            value={filtros.numero || ''}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filtros.tipo || ''}
              label="Tipo"
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Administrativo">Administrativo</MenuItem>
              <MenuItem value="Processo Administrativo Disciplinar">PAD</MenuItem>
              <MenuItem value="Licitação">Licitação</MenuItem>
              <MenuItem value="Análise Legislativa">Análise Legislativa</MenuItem>
              <MenuItem value="Revisão Contratual">Revisão Contratual</MenuItem>
              <MenuItem value="Ação de Improbidade">Ação de Improbidade</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Interessado</InputLabel>
            <Select
              value={filtros.interessado || ''}
              label="Interessado"
              onChange={(e) => handleFilterChange('interessado', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="SEFAZ">SEFAZ-RJ</MenuItem>
              <MenuItem value="CGE">CGE-RJ</MenuItem>
              <MenuItem value="SEPLAG">SEPLAG-RJ</MenuItem>
              <MenuItem value="PGE">PGE-RJ</MenuItem>
              <MenuItem value="MPRJ">MPRJ</MenuItem>
              <MenuItem value="ALERJ">ALERJ</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Lista de Processos */}
      <Grid container spacing={2}>
        {processos.map((processo) => (
          <Grid item xs={12} sm={6} md={4} key={processo.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 6,
                  cursor: 'pointer'
                }
              }}
              onClick={() => visualizarProcesso(processo.id)}
            >
              <CardContent>
                {/* Número do Processo */}
                <Typography 
                  variant="h6" 
                  color="primary" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {processo.numero}
                </Typography>

                {/* Tipo do Processo */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 40,
                  }}
                >
                  {processo.tipo || 'Sem tipo definido'}
                </Typography>

                {/* Interessado */}
                <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1 }}>
                  <strong>Interessado:</strong> {processo.interessado || 'N/A'}
                </Typography>

                {/* Situação */}
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={processo.situacao || 'Em tramitação'} 
                    color="primary"
                    size="small"
                  />
                </Box>

                {/* Informações adicionais */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.disabled">
                    {processo.total_documentos || 0} docs
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {processo.data_autuacao ? new Date(processo.data_autuacao).toLocaleDateString('pt-BR') : 'N/A'}
                  </Typography>
                </Box>

                {/* Botão de ação */}
                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    visualizarProcesso(processo.id);
                  }}
                >
                  Visualizar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Paginação */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Informações de debug */}
      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Debug:</strong> Mostrando {processos.length} de {totalProcessos} processos | 
          Página {page} de {totalPages} | 
          API: {processosData ? '✅ Conectada' : '❌ Desconectada'}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProcessosList; 