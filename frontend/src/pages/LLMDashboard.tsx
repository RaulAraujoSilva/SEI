import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Alert,
  CircularProgress,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  LinearProgress,
  Divider,
  Fab,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  AttachMoney as MoneyIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Memory as TokenIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Build as ConfigIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  useEstatisticasLLM,
  useEstimativaCusto,
  useConfiguracaoLLM,
  useUpdateConfiguracaoLLM,
  useAnalisarDocumento,
  useInvalidateQueries,
} from '../hooks/useApi';

// Registrar componentes Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

const LLMDashboard: React.FC = () => {
  // ============================================================================
  // ESTADOS E HOOKS
  // ============================================================================
  const [configDialog, setConfigDialog] = useState(false);
  const [analiseDialog, setAnaliseDialog] = useState(false);
  const [documentoId, setDocumentoId] = useState<number | null>(null);

  // Hooks da API
  const { data: stats, isLoading: statsLoading, error: statsError } = useEstatisticasLLM();
  const { data: custos, isLoading: custosLoading } = useEstimativaCusto();
  const { data: config, isLoading: configLoading } = useConfiguracaoLLM();
  const updateConfig = useUpdateConfiguracaoLLM();
  const analisarDoc = useAnalisarDocumento();
  const { invalidateLLM } = useInvalidateQueries();

  // Estados locais para configuração
  const [configForm, setConfigForm] = useState({
    provider: 'openai',
    modelo: 'gpt-4',
    temperatura: 0.3,
    max_tokens: 2000,
    chunk_size: 1000,
    max_chunks: 5,
    timeout: 30,
    custo_input_1k: 0.03,
    custo_output_1k: 0.06,
    ativo: true,
  });

  // ============================================================================
  // EFEITOS
  // ============================================================================
  React.useEffect(() => {
    if (config) {
      setConfigForm({
        provider: config.provider || 'openai',
        modelo: config.modelo || 'gpt-4',
        temperatura: config.temperatura || 0.3,
        max_tokens: config.max_tokens || 2000,
        chunk_size: config.chunk_size || 1000,
        max_chunks: config.max_chunks || 5,
        timeout: config.timeout || 30,
        custo_input_1k: config.custo_input_1k || 0.03,
        custo_output_1k: config.custo_output_1k || 0.06,
        ativo: config.ativo ?? true,
      });
    }
  }, [config]);

  // ============================================================================
  // FUNÇÕES
  // ============================================================================
  const handleConfigSave = () => {
    updateConfig.mutate(configForm);
    setConfigDialog(false);
  };

  const handleAnaliseSubmit = () => {
    if (documentoId) {
      analisarDoc.mutate(documentoId);
      setAnaliseDialog(false);
      setDocumentoId(null);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  // ============================================================================
  // LOADING E ERROR STATES
  // ============================================================================
  if (statsError) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard LLM
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Erro ao carregar dados LLM:</strong> {statsError.message || 'Erro desconhecido'}
          <br />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Verifique se o backend está configurado corretamente.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (statsLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard LLM
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Carregando estatísticas LLM...
        </Alert>

        {/* Skeleton dos cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // ============================================================================
  // DADOS PARA GRÁFICOS
  // ============================================================================
  const chartData = {
    bar: {
      labels: stats?.por_modelo ? Object.keys(stats.por_modelo) : ['GPT-4', 'GPT-3.5'],
      datasets: [
        {
          label: 'Análises por Modelo',
          data: stats?.por_modelo ? Object.values(stats.por_modelo).map(m => m.total) : [45, 32],
          backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
          borderRadius: 4,
        },
      ],
    },
    doughnut: {
      labels: ['Sucesso', 'Erro', 'Pendente'],
      datasets: [
        {
          data: [
            stats?.analises_sucesso || 67,
            stats?.analises_erro || 8,
            (stats?.total_analises || 75) - (stats?.analises_sucesso || 67) - (stats?.analises_erro || 8),
          ],
          backgroundColor: ['#4CAF50', '#F44336', '#FF9800'],
          borderWidth: 0,
        },
      ],
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          Dashboard LLM
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => invalidateLLM()}
            disabled={statsLoading}
          >
            Atualizar
          </Button>
          <Button
            startIcon={<ConfigIcon />}
            variant="outlined"
            onClick={() => setConfigDialog(true)}
          >
            Configurar
          </Button>
        </Box>
      </Box>

      {/* Status da Configuração */}
      <Alert 
        severity={config?.ativo ? 'success' : 'warning'} 
        sx={{ mb: 3 }}
        icon={config?.ativo ? <SuccessIcon /> : <ErrorIcon />}
      >
        <strong>Status LLM:</strong> {config?.ativo ? 'Ativo' : 'Inativo'} | 
        Modelo: {config?.modelo || 'Não configurado'} | 
        Provider: {config?.provider || 'Não definido'}
        
        {!config?.ativo && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Configure o LLM para habilitar análises automáticas de documentos.
          </Typography>
        )}
      </Alert>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom variant="h6">
                    Total Análises
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatNumber(stats?.total_analises || 0)}
                  </Typography>
                  <Typography color="white" variant="body2">
                    Documentos processados
                  </Typography>
                </Box>
                <AIIcon sx={{ fontSize: 48, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom variant="h6">
                    Taxa Sucesso
                  </Typography>
                  <Typography variant="h4" color="white">
                    {stats?.total_analises ? 
                      Math.round((stats.analises_sucesso / stats.total_analises) * 100) : 0}%
                  </Typography>
                  <Typography color="white" variant="body2">
                    {formatNumber(stats?.analises_sucesso || 0)} sucessos
                  </Typography>
                </Box>
                <SuccessIcon sx={{ fontSize: 48, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom variant="h6">
                    Tokens Usados
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatNumber(stats?.tokens_total || 0)}
                  </Typography>
                  <Typography color="white" variant="body2">
                    Input + Output
                  </Typography>
                </Box>
                <TokenIcon sx={{ fontSize: 48, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom variant="h6">
                    Custo Total
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatCurrency(stats?.custo_total || 0)}
                  </Typography>
                  <Typography color="white" variant="body2">
                    Investimento IA
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos e Análises */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de Análises por Modelo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Análises por Modelo LLM
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={chartData.bar} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Gráfico de Status das Análises */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom color="secondary">
              🎯 Status das Análises
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut data={chartData.doughnut} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Estimativa de Custos e Performance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              💰 Estimativa de Custos
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Documentos Pendentes: {formatNumber(custos?.documentos_pendentes || 0)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((custos?.documentos_pendentes || 0) / 100 * 100, 100)} 
                sx={{ mt: 1, mb: 2 }}
              />
              <Typography variant="h5" color="primary">
                Estimativa: {formatCurrency(custos?.estimativa_custo || 0)}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Baseado na configuração atual do modelo {config?.modelo}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="secondary">
              ⚡ Performance Média
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {stats?.tempo_medio ? Math.round(stats.tempo_medio) : 0}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tempo Médio
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary">
                    {stats?.analises_erro || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Erros Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Performance baseada em {formatNumber(stats?.total_analises || 0)} análises
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Modelos por Performance */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🏆 Desempenho por Modelo LLM
        </Typography>
        <Grid container spacing={2}>
          {stats?.por_modelo && Object.entries(stats.por_modelo).map(([modelo, dados]) => (
            <Grid item xs={12} sm={6} md={4} key={modelo}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">{modelo}</Typography>
                    <Chip 
                      label={dados.sucesso === dados.total ? 'Perfeito' : 'Bom'}
                      color={dados.sucesso === dados.total ? 'success' : 'primary'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total: {formatNumber(dados.total)} | Sucesso: {formatNumber(dados.sucesso)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Custo: {formatCurrency(dados.custo)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={dados.total ? (dados.sucesso / dados.total) * 100 : 0}
                    sx={{ mt: 2 }}
                    color={dados.sucesso === dados.total ? 'success' : 'primary'}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* FAB para Nova Análise */}
      <Fab
        color="primary"
        aria-label="nova análise"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setAnaliseDialog(true)}
      >
        <PlayIcon />
      </Fab>

      {/* Dialog de Configuração LLM */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>⚙️ Configurações LLM</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={configForm.provider}
                  onChange={(e) => setConfigForm({...configForm, provider: e.target.value})}
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="anthropic">Anthropic</MenuItem>
                  <MenuItem value="google">Google</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modelo"
                value={configForm.modelo}
                onChange={(e) => setConfigForm({...configForm, modelo: e.target.value})}
                placeholder="gpt-4, claude-3, gemini-pro"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Temperatura"
                type="number"
                value={configForm.temperatura}
                onChange={(e) => setConfigForm({...configForm, temperatura: parseFloat(e.target.value)})}
                inputProps={{ min: 0, max: 2, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Tokens"
                type="number"
                value={configForm.max_tokens}
                onChange={(e) => setConfigForm({...configForm, max_tokens: parseInt(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Chunk Size"
                type="number"
                value={configForm.chunk_size}
                onChange={(e) => setConfigForm({...configForm, chunk_size: parseInt(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Timeout (s)"
                type="number"
                value={configForm.timeout}
                onChange={(e) => setConfigForm({...configForm, timeout: parseInt(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custo Input (por 1k tokens)"
                type="number"
                value={configForm.custo_input_1k}
                onChange={(e) => setConfigForm({...configForm, custo_input_1k: parseFloat(e.target.value)})}
                inputProps={{ step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custo Output (por 1k tokens)"
                type="number"
                value={configForm.custo_output_1k}
                onChange={(e) => setConfigForm({...configForm, custo_output_1k: parseFloat(e.target.value)})}
                inputProps={{ step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configForm.ativo}
                    onChange={(e) => setConfigForm({...configForm, ativo: e.target.checked})}
                  />
                }
                label="LLM Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleConfigSave} 
            variant="contained"
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Nova Análise */}
      <Dialog open={analiseDialog} onClose={() => setAnaliseDialog(false)}>
        <DialogTitle>▶️ Analisar Documento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="ID do Documento"
            type="number"
            value={documentoId || ''}
            onChange={(e) => setDocumentoId(parseInt(e.target.value))}
            sx={{ mt: 2 }}
            placeholder="Digite o ID do documento para análise"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Inicia uma análise LLM completa do documento selecionado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnaliseDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAnaliseSubmit} 
            variant="contained"
            disabled={!documentoId || analisarDoc.isPending}
          >
            {analisarDoc.isPending ? <CircularProgress size={20} /> : 'Analisar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LLMDashboard; 