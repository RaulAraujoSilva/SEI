import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Skeleton,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Palette as ThemeIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  BrightnessAuto as AutoIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  TrendingUp as ReportsIcon,
  Warning as AlertIcon,
} from '@mui/icons-material';
import { useConfiguracoes, useUpdateConfiguracoes } from '../hooks/useApi';
import { ConfiguracaoForm } from '../types';

const Configuracoes: React.FC = () => {
  // ============================================================================
  // ESTADOS E HOOKS
  // ============================================================================
  const { data: config, isLoading, error } = useConfiguracoes();
  const updateConfig = useUpdateConfiguracoes();

  // Estados do formulário
  const [formData, setFormData] = useState<ConfiguracaoForm>({
    nome: '',
    email: '',
    tema: 'auto',
    idioma: 'pt-BR',
    densidade: 'normal',
    notificacoes: {
      processo_coletado: true,
      erro_coleta: true,
      analise_concluida: true,
      limite_orcamento: true,
      relatorio_semanal: false,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<string>('perfil');

  // ============================================================================
  // EFEITOS
  // ============================================================================
  useEffect(() => {
    if (config) {
      setFormData({
        nome: config.nome || 'Usuário SEI-Com AI',
        email: config.email || 'usuario@sefaz.rj.gov.br',
        tema: config.tema || 'auto',
        idioma: config.idioma || 'pt-BR',
        densidade: config.densidade || 'normal',
        notificacoes: {
          processo_coletado: config.notificacoes?.processo_coletado ?? true,
          erro_coleta: config.notificacoes?.erro_coleta ?? true,
          analise_concluida: config.notificacoes?.analise_concluida ?? true,
          limite_orcamento: config.notificacoes?.limite_orcamento ?? true,
          relatorio_semanal: config.notificacoes?.relatorio_semanal ?? false,
        },
      });
    }
  }, [config]);

  // ============================================================================
  // FUNÇÕES
  // ============================================================================
  const handleChange = (field: keyof ConfiguracaoForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleNotificationChange = (notif: keyof ConfiguracaoForm['notificacoes'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificacoes: {
        ...prev.notificacoes,
        [notif]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfig.mutate(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        nome: config.nome || 'Usuário SEI-Com AI',
        email: config.email || 'usuario@sefaz.rj.gov.br',
        tema: config.tema || 'auto',
        idioma: config.idioma || 'pt-BR',
        densidade: config.densidade || 'normal',
        notificacoes: {
          processo_coletado: config.notificacoes?.processo_coletado ?? true,
          erro_coleta: config.notificacoes?.erro_coleta ?? true,
          analise_concluida: config.notificacoes?.analise_concluida ?? true,
          limite_orcamento: config.notificacoes?.limite_orcamento ?? true,
          relatorio_semanal: config.notificacoes?.relatorio_semanal ?? false,
        },
      });
    }
    setHasChanges(false);
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <LightIcon />;
      case 'dark': return <DarkIcon />;
      default: return <AutoIcon />;
    }
  };

  const getDensidadeLabel = (densidade: string) => {
    switch (densidade) {
      case 'compacta': return 'Compacta';
      case 'confortavel': return 'Confortável';
      default: return 'Normal';
    }
  };

  // ============================================================================
  // LOADING E ERROR STATES
  // ============================================================================
  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Configurações
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Erro ao carregar configurações:</strong> {error.message || 'Erro desconhecido'}
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Configurações
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Carregando configurações...
        </Alert>

        {/* Skeleton dos accordions */}
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="70%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <SettingsIcon color="primary" />
          Configurações
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Restaurar
          </Button>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges || updateConfig.isPending}
          >
            {updateConfig.isPending ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </Box>
      </Box>

      {/* Alert de alterações pendentes */}
      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Alterações não salvas:</strong> Você tem configurações pendentes. Clique em "Salvar" para aplicar.
        </Alert>
      )}

      {/* Configurações organizadas em accordions */}
      
      {/* 1. Perfil do Usuário */}
      <Accordion 
        expanded={expandedPanel === 'perfil'} 
        onChange={() => setExpandedPanel(expandedPanel === 'perfil' ? '' : 'perfil')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={2}>
            <PersonIcon color="primary" />
            <Box>
              <Typography variant="h6">Perfil do Usuário</Typography>
              <Typography variant="body2" color="text.secondary">
                Informações pessoais e dados da conta
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                  {formData.nome.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{formData.nome}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Usuário SEI-Com AI
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 2. Aparência e Tema */}
      <Accordion 
        expanded={expandedPanel === 'aparencia'} 
        onChange={() => setExpandedPanel(expandedPanel === 'aparencia' ? '' : 'aparencia')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={2}>
            <ThemeIcon color="primary" />
            <Box>
              <Typography variant="h6">Aparência e Tema</Typography>
              <Typography variant="body2" color="text.secondary">
                Personalização da interface e experiência visual
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tema da Interface</InputLabel>
                <Select
                  value={formData.tema}
                  onChange={(e) => handleChange('tema', e.target.value)}
                  startAdornment={getThemeIcon(formData.tema)}
                >
                  <MenuItem value="light">
                    <Box display="flex" alignItems="center" gap={1}>
                      <LightIcon />
                      Claro
                    </Box>
                  </MenuItem>
                  <MenuItem value="dark">
                    <Box display="flex" alignItems="center" gap={1}>
                      <DarkIcon />
                      Escuro
                    </Box>
                  </MenuItem>
                  <MenuItem value="auto">
                    <Box display="flex" alignItems="center" gap={1}>
                      <AutoIcon />
                      Automático (Sistema)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Densidade da Interface</InputLabel>
                <Select
                  value={formData.densidade}
                  onChange={(e) => handleChange('densidade', e.target.value)}
                >
                  <MenuItem value="compacta">Compacta</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="confortavel">Confortável</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Idioma</InputLabel>
                <Select
                  value={formData.idioma}
                  onChange={(e) => handleChange('idioma', e.target.value)}
                  startAdornment={<LanguageIcon />}
                >
                  <MenuItem value="pt-BR">
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>🇧🇷</span>
                      Português (Brasil)
                    </Box>
                  </MenuItem>
                  <MenuItem value="en-US">
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>🇺🇸</span>
                      English (US)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Configuração Atual
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    icon={getThemeIcon(formData.tema)} 
                    label={`Tema: ${formData.tema}`} 
                    size="small" 
                  />
                  <Chip 
                    label={`Densidade: ${getDensidadeLabel(formData.densidade)}`} 
                    size="small" 
                  />
                  <Chip 
                    icon={<LanguageIcon />} 
                    label={`Idioma: ${formData.idioma}`} 
                    size="small" 
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 3. Notificações */}
      <Accordion 
        expanded={expandedPanel === 'notificacoes'} 
        onChange={() => setExpandedPanel(expandedPanel === 'notificacoes' ? '' : 'notificacoes')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={2}>
            <NotificationsIcon color="primary" />
            <Box>
              <Typography variant="h6">Notificações</Typography>
              <Typography variant="body2" color="text.secondary">
                Gerencie alertas e notificações do sistema
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <ScheduleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Processo Coletado"
                secondary="Notificar quando um novo processo for coletado do SEI"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={formData.notificacoes.processo_coletado}
                  onChange={(e) => handleNotificationChange('processo_coletado', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <AlertIcon color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Erro na Coleta"
                secondary="Alertas quando houver falhas na coleta de processos"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={formData.notificacoes.erro_coleta}
                  onChange={(e) => handleNotificationChange('erro_coleta', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <SettingsIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Análise IA Concluída"
                secondary="Notificar quando análises LLM forem finalizadas"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={formData.notificacoes.analise_concluida}
                  onChange={(e) => handleNotificationChange('analise_concluida', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <AlertIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Limite de Orçamento"
                secondary="Alertas quando custos LLM se aproximarem do limite"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={formData.notificacoes.limite_orcamento}
                  onChange={(e) => handleNotificationChange('limite_orcamento', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <ReportsIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Relatório Semanal"
                secondary="Receber resumo semanal de atividades e estatísticas"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={formData.notificacoes.relatorio_semanal}
                  onChange={(e) => handleNotificationChange('relatorio_semanal', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
          
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              {Object.values(formData.notificacoes).filter(Boolean).length} de {Object.keys(formData.notificacoes).length} notificações ativadas
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 4. Sistema e Segurança */}
      <Accordion 
        expanded={expandedPanel === 'sistema'} 
        onChange={() => setExpandedPanel(expandedPanel === 'sistema' ? '' : 'sistema')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={2}>
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="h6">Sistema e Segurança</Typography>
              <Typography variant="body2" color="text.secondary">
                Informações do sistema e configurações avançadas
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Informações do Sistema
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Versão"
                      secondary="SEI-Com AI v1.0.0"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Ambiente"
                      secondary="Desenvolvimento (SQLite)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Frontend"
                      secondary="React 18 + TypeScript"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Backend"
                      secondary="FastAPI + Python 3.12"
                    />
                  </ListItem>
                </List>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="secondary">
                  Estatísticas de Uso
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Tempo de Uso"
                      secondary="Primeira sessão"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Processos Coletados"
                      secondary="0 processos"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Análises IA"
                      secondary="0 documentos"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Custo Total LLM"
                      secondary="R$ 0,00"
                    />
                  </ListItem>
                </List>
              </Card>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>🔒 Privacidade:</strong> Suas configurações são armazenadas localmente e sincronizadas com o backend de forma segura.
              Dados pessoais não são compartilhados com terceiros.
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Footer de status */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          <strong>💫 Configurações SEI-Com AI</strong> - Personalize sua experiência de acordo com suas preferências.
          Alterações são aplicadas imediatamente após salvar.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Configuracoes; 