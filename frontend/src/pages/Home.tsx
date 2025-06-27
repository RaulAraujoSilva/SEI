import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Container,
  Paper,
  Alert,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as ProcessosIcon,
  Description as DocumentosIcon,
  Psychology as LLMIcon,
  Add as NovoIcon,
  Settings as ConfigIcon,
  Assessment as ReportsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Dashboard',
      description: 'Visão geral do sistema com estatísticas e atividades recentes',
      icon: <DashboardIcon sx={{ fontSize: 40 }} />,
      route: '/dashboard',
      color: '#1976d2',
      status: 'funcional',
      features: ['Estatísticas gerais', 'Processos recentes', 'Atividades', 'Métricas LLM']
    },
    {
      title: 'Processos',
      description: 'Gerenciamento completo de processos do SEI',
      icon: <ProcessosIcon sx={{ fontSize: 40 }} />,
      route: '/processos',
      color: '#2e7d32',
      status: 'funcional',
      features: ['Lista com filtros', 'Busca avançada', 'Cards interativos', 'Paginação']
    },
    {
      title: 'Documentos',
      description: 'Visualização e análise de documentos dos processos',
      icon: <DocumentosIcon sx={{ fontSize: 40 }} />,
      route: '/documentos',
      color: '#ed6c02',
      status: 'desenvolvimento',
      features: ['Lista de documentos', 'Preview', 'Tags extraídas', 'Entidades']
    },
    {
      title: 'Análise LLM',
      description: 'Dashboard de análises com IA e estatísticas de processamento',
      icon: <LLMIcon sx={{ fontSize: 40 }} />,
      route: '/llm',
      color: '#9c27b0',
      status: 'desenvolvimento',
      features: ['Custos por modelo', 'Histórico', 'Configurações', 'Estatísticas']
    },
    {
      title: 'Novo Processo',
      description: 'Criação e importação de novos processos',
      icon: <NovoIcon sx={{ fontSize: 40 }} />,
      route: '/novo-processo',
      color: '#d32f2f',
      status: 'desenvolvimento',
      features: ['Criação manual', 'Importação SEI', 'Upload docs', 'Validação']
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema e preferências do usuário',
      icon: <ConfigIcon sx={{ fontSize: 40 }} />,
      route: '/configuracoes',
      color: '#616161',
      status: 'desenvolvimento',
      features: ['Preferências', 'Tema dark/light', 'API config', 'Notificações']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funcional':
        return 'success';
      case 'desenvolvimento':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'funcional':
        return 'Funcional';
      case 'desenvolvimento':
        return 'Em Desenvolvimento';
      default:
        return 'Planejado';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            SEI-Com AI
          </Typography>
          <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
            Sistema de Análise Inteligente de Processos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Plataforma automatizada para coleta, armazenamento e análise de processos 
            do Sistema Eletrônico de Informações (SEI) do Rio de Janeiro
          </Typography>
        </Box>

        {/* Status do Sistema */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Status do Sistema:</strong>
          </Typography>
          <Typography variant="body2">
            • Backend API: 47 endpoints funcionais (86.2% taxa de sucesso)<br/>
            • Frontend: 45% concluído - Base sólida implementada<br/>
            • Páginas funcionais: Dashboard e Lista de Processos
          </Typography>
        </Alert>

        {/* Menu Principal */}
        <Typography variant="h4" component="h2" gutterBottom textAlign="center" mb={3}>
          🚀 Módulos do Sistema
        </Typography>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Ícone e Status */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box sx={{ color: item.color }}>
                      {item.icon}
                    </Box>
                    <Chip 
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status) as any}
                      size="small"
                    />
                  </Box>

                  {/* Título e Descrição */}
                  <Typography variant="h6" component="h3" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.description}
                  </Typography>

                  {/* Features */}
                  <Typography variant="subtitle2" gutterBottom>
                    Funcionalidades:
                  </Typography>
                  <Box>
                    {item.features.map((feature, idx) => (
                      <Typography key={idx} variant="caption" display="block" color="text.secondary">
                        • {feature}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    fullWidth
                    variant={item.status === 'funcional' ? 'contained' : 'outlined'}
                    sx={{ 
                      backgroundColor: item.status === 'funcional' ? item.color : 'transparent',
                      borderColor: item.color,
                      color: item.status === 'funcional' ? 'white' : item.color,
                      '&:hover': {
                        backgroundColor: item.color,
                        color: 'white'
                      }
                    }}
                    onClick={() => navigate(item.route)}
                  >
                    {item.status === 'funcional' ? 'Acessar' : 'Visualizar'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Estatísticas Rápidas */}
        <Paper sx={{ p: 3, mt: 4, background: 'linear-gradient(45deg, #f5f5f5 30%, #e3f2fd 90%)' }}>
          <Typography variant="h6" gutterBottom>
            📊 Estatísticas de Desenvolvimento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" color="primary">4</Typography>
              <Typography variant="body2">Componentes</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" color="secondary">2</Typography>
              <Typography variant="body2">Páginas Funcionais</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" color="success.main">47</Typography>
              <Typography variant="body2">Endpoints API</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" color="warning.main">45%</Typography>
              <Typography variant="body2">Progresso</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Próximos Passos */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🎯 Próximos Desenvolvimentos
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Prioridade 1:</strong>
              </Typography>
              <Typography variant="body2" component="ul">
                <li>ProcessoDetails - Página completa de detalhes</li>
                <li>DocumentoDetails - Visualização de documentos</li>
                <li>NovoProcesso - Formulário de criação</li>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Funcionalidades Avançadas:</strong>
              </Typography>
              <Typography variant="body2" component="ul">
                <li>Gráficos e visualizações</li>
                <li>Sistema de notificações</li>
                <li>Upload de arquivos</li>
                <li>Exportação de relatórios</li>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home; 