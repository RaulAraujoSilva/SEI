import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProcessCard } from '../components';
import { Processo } from '../types';

const ProcessosList: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    page: 1,
    size: 12,
    numero: '',
    tipo: '',
    situacao: '',
  });

  // Dados mock para demonstração
  const processosMock: Processo[] = [
    {
      id: 1,
      numero: '2024/001-RJ',
      tipo: 'administrativo',
      assunto: 'Licitação para aquisição de equipamentos de TI para modernização da infraestrutura',
      interessado: 'Secretaria de Estado de Fazenda',
      situacao: 'tramitacao',
      data_autuacao: '2024-01-15',
      orgao: 'SEFAZ-RJ',
      url_sei: 'https://sei.rj.gov.br/processo/2024001',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-27T09:15:00Z',
      total_documentos: 12,
      documentos_analisados: 8,
      custo_total_llm: 15.45,
    },
    {
      id: 2,
      numero: '2024/002-RJ',
      tipo: 'judicial',
      assunto: 'Processo administrativo disciplinar contra servidor',
      interessado: 'Corregedoria Geral do Estado',
      situacao: 'concluido',
      data_autuacao: '2024-01-10',
      orgao: 'CGE-RJ',
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-25T16:30:00Z',
      total_documentos: 23,
      documentos_analisados: 23,
      custo_total_llm: 34.20,
    },
    {
      id: 3,
      numero: '2024/003-RJ',
      tipo: 'executivo',
      assunto: 'Contratação de serviços de consultoria em gestão pública',
      interessado: 'Secretaria de Planejamento',
      situacao: 'tramitacao',
      data_autuacao: '2024-01-20',
      orgao: 'SEPLAG-RJ',
      created_at: '2024-01-20T08:45:00Z',
      updated_at: '2024-01-27T11:20:00Z',
      total_documentos: 7,
      documentos_analisados: 5,
      custo_total_llm: 8.90,
    },
    {
      id: 4,
      numero: '2024/004-RJ',
      tipo: 'legislativo',
      assunto: 'Análise de projeto de lei sobre transparência fiscal',
      interessado: 'Assembleia Legislativa do Estado',
      situacao: 'suspenso',
      data_autuacao: '2024-01-12',
      orgao: 'ALERJ',
      created_at: '2024-01-12T15:10:00Z',
      updated_at: '2024-01-24T13:45:00Z',
      total_documentos: 18,
      documentos_analisados: 12,
      custo_total_llm: 22.15,
    },
    {
      id: 5,
      numero: '2024/005-RJ',
      tipo: 'administrativo',
      assunto: 'Revisão de contratos de terceirização de serviços',
      interessado: 'Procuradoria Geral do Estado',
      situacao: 'tramitacao',
      data_autuacao: '2024-01-25',
      orgao: 'PGE-RJ',
      created_at: '2024-01-25T09:30:00Z',
      updated_at: '2024-01-27T10:15:00Z',
      total_documentos: 15,
      documentos_analisados: 3,
      custo_total_llm: 4.25,
    },
    {
      id: 6,
      numero: '2024/006-RJ',
      tipo: 'judicial',
      assunto: 'Ação de improbidade administrativa',
      interessado: 'Ministério Público do Estado',
      situacao: 'concluido',
      data_autuacao: '2024-01-08',
      orgao: 'MPRJ',
      created_at: '2024-01-08T11:20:00Z',
      updated_at: '2024-01-26T14:30:00Z',
      total_documentos: 31,
      documentos_analisados: 31,
      custo_total_llm: 47.80,
    },
  ];

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset page when filtering
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  const handleView = (id: number) => {
    navigate(`/processos/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/processos/${id}/edit`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este processo?')) {
      alert(`Processo ${id} seria excluído (funcionalidade demo)`);
    }
  };

  const handleAnalyze = (id: number) => {
    alert(`Análise do processo ${id} seria iniciada (funcionalidade demo)`);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      size: 12,
      numero: '',
      tipo: '',
      situacao: '',
    });
  };

  // Filtrar processos baseado nos filtros
  const processosFiltrados = processosMock.filter(processo => {
    if (filters.numero && !processo.numero.toLowerCase().includes(filters.numero.toLowerCase())) {
      return false;
    }
    if (filters.tipo && processo.tipo !== filters.tipo) {
      return false;
    }
    if (filters.situacao && processo.situacao !== filters.situacao) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(processosFiltrados.length / filters.size);
  const startIndex = (filters.page - 1) * filters.size;
  const processosPage = processosFiltrados.slice(startIndex, startIndex + filters.size);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Lista de Processos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/novo-processo')}
        >
          Novo Processo
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Modo Demonstração:</strong> Esta lista mostra {processosMock.length} processos simulados. 
        Os filtros e componentes visuais estão funcionais. Teste os cards, filtros e navegação.
      </Alert>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Número do Processo"
              value={filters.numero}
              onChange={(e) => handleFilterChange('numero', e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.tipo}
                label="Tipo"
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="administrativo">Administrativo</MenuItem>
                <MenuItem value="judicial">Judicial</MenuItem>
                <MenuItem value="executivo">Executivo</MenuItem>
                <MenuItem value="legislativo">Legislativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Situação</InputLabel>
              <Select
                value={filters.situacao}
                label="Situação"
                onChange={(e) => handleFilterChange('situacao', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="tramitacao">Tramitação</MenuItem>
                <MenuItem value="concluido">Concluído</MenuItem>
                <MenuItem value="suspenso">Suspenso</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                startIcon={<FilterIcon />}
              >
                Limpar
              </Button>
              
              <Tooltip title={viewMode === 'grid' ? 'Vista em Lista' : 'Vista em Grade'}>
                <IconButton
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  size="small"
                >
                  {viewMode === 'grid' ? <ListIcon /> : <GridIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Resultados */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {processosPage.length} de {processosFiltrados.length} processos
          {filters.numero || filters.tipo || filters.situacao ? ' (filtrados)' : ''}
        </Typography>
      </Box>

      {/* Lista de Processos */}
      {processosPage.length > 0 ? (
        <Grid container spacing={2}>
          {processosPage.map((processo) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={processo.id}>
              <ProcessCard
                processo={processo}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAnalyze={handleAnalyze}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum processo encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Tente ajustar os filtros ou criar um novo processo.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/novo-processo')}
          >
            Criar Primeiro Processo
          </Button>
        </Paper>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={filters.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default ProcessosList; 