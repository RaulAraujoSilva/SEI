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
    interessados: '',
  });

  // Dados mock - AJUSTADOS PARA ESPECIFICAÇÃO SEI
  const processosMock: Processo[] = [
    {
      id: 1,
      numero: 'SEI-070002/013015/2024',
      tipo: 'Administrativo: Elaboração de Correspondência',
      data_geracao: '2024-07-16',
      interessados: 'Secretaria de Estado de Fazenda - SEFAZ/RJ',
      url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=070002013015',
      observacao_usuario: 'Processo prioritário para análise',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-27T09:15:00Z',
      total_documentos: 12,
      documentos_analisados: 8,
      custo_total_llm: 15.45,
      localizacao_atual: 'SEFAZ/COGET - Coordenação de Gestão Tecnológica',
    },
    {
      id: 2,
      numero: 'SEI-040001/008732/2024',
      tipo: 'Processo Administrativo Disciplinar',
      data_geracao: '2024-05-20',
      interessados: 'Corregedoria Geral do Estado - CGE/RJ',
      url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=040001008732',
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-25T16:30:00Z',
      total_documentos: 23,
      documentos_analisados: 23,
      custo_total_llm: 34.20,
      localizacao_atual: 'CGE/CORREGEDORIA - Concluído',
    },
    {
      id: 3,
      numero: 'SEI-120005/025678/2024',
      tipo: 'Licitação: Pregão Eletrônico',
      data_geracao: '2024-08-10',
      interessados: 'Secretaria de Planejamento e Gestão - SEPLAG/RJ',
      url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=120005025678',
      observacao_usuario: 'Contratação de consultoria em gestão',
      created_at: '2024-01-20T08:45:00Z',
      updated_at: '2024-01-27T11:20:00Z',
      total_documentos: 7,
      documentos_analisados: 5,
      custo_total_llm: 8.90,
      localizacao_atual: 'SEPLAG/CPL - Comissão Permanente de Licitação',
    },
    {
      id: 4,
      numero: 'SEI-030002/011456/2024',
      tipo: 'Análise Legislativa: Projeto de Lei',
      data_geracao: '2024-06-12',
      interessados: 'Assembleia Legislativa do Estado do Rio de Janeiro - ALERJ',
      url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=030002011456',
      created_at: '2024-01-12T15:10:00Z',
      updated_at: '2024-01-24T13:45:00Z',
      total_documentos: 18,
      documentos_analisados: 12,
      custo_total_llm: 22.15,
      localizacao_atual: 'ALERJ/COMISSÃO - Em análise técnica',
    },
    {
      id: 5,
      numero: 'SEI-080003/017890/2024',
      tipo: 'Revisão Contratual',
      data_geracao: '2024-09-25',
      interessados: 'Procuradoria Geral do Estado - PGE/RJ',
      url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=080003017890',
      observacao_usuario: 'Contratos de terceirização prioritários',
      created_at: '2024-01-25T09:30:00Z',
      updated_at: '2024-01-27T10:15:00Z',
      total_documentos: 15,
      documentos_analisados: 3,
      custo_total_llm: 4.25,
      localizacao_atual: 'PGE/PROCURADORIA - Em tramitação',
    },
    {
      id: 6,
      numero: 'SEI-050001/012345/2024',
      tipo: 'Ação de Improbidade Administrativa',
      data_geracao: '2024-04-08',
      interessados: 'Ministério Público do Estado do Rio de Janeiro - MPRJ',
      url_processo: 'https://sei.rj.gov.br/sei/controlador.php?acao=protocolo_visualizar&id_protocolo=050001012345',
      created_at: '2024-01-08T11:20:00Z',
      updated_at: '2024-01-26T14:30:00Z',
      total_documentos: 31,
      documentos_analisados: 31,
      custo_total_llm: 47.80,
      localizacao_atual: 'MPRJ/PROMOTORIA - Processo arquivado',
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
      interessados: '',
    });
  };

  // Filtrar processos baseado nos filtros
  const processosFiltrados = processosMock.filter(processo => {
    if (filters.numero && !processo.numero.toLowerCase().includes(filters.numero.toLowerCase())) {
      return false;
    }
    if (filters.tipo && !processo.tipo.toLowerCase().includes(filters.tipo.toLowerCase())) {
      return false;
    }
    if (filters.interessados && !processo.interessados.toLowerCase().includes(filters.interessados.toLowerCase())) {
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
                <MenuItem value="Administrativo">Administrativo</MenuItem>
                <MenuItem value="Processo Administrativo Disciplinar">PAD</MenuItem>
                <MenuItem value="Licitação">Licitação</MenuItem>
                <MenuItem value="Análise Legislativa">Análise Legislativa</MenuItem>
                <MenuItem value="Revisão Contratual">Revisão Contratual</MenuItem>
                <MenuItem value="Ação de Improbidade">Ação de Improbidade</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Interessados"
              value={filters.interessados}
              onChange={(e) => handleFilterChange('interessados', e.target.value)}
              placeholder="Ex: SEFAZ, CGE, SEPLAG..."
            />
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
          {filters.numero || filters.tipo || filters.interessados ? ' (filtrados)' : ''}
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