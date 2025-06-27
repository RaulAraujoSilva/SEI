import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Alert,
} from '@mui/material';

const Dashboard: React.FC = () => {
  // Dados mock para demonstração das páginas
  const isLoading = false;
  const error = null;
  
  const stats = {
    total_processos: 23,
    total_documentos: 187,
    documentos_analisados: 156,
    custo_total_llm: 89.45,
    taxa_sucesso: 94.2,
  };

  const processosRecentes = [
    { id: 1, numero: '2024/001-RJ', assunto: 'Licitação para aquisição de equipamentos de TI' },
    { id: 2, numero: '2024/002-RJ', assunto: 'Processo administrativo disciplinar' },
    { id: 3, numero: '2024/003-RJ', assunto: 'Contratação de serviços de consultoria' },
    { id: 4, numero: '2024/004-RJ', assunto: 'Análise de documentação fiscal' },
    { id: 5, numero: '2024/005-RJ', assunto: 'Revisão de contratos vigentes' },
  ];

  const atividades = [
    { id: 1, mensagem: 'Novo processo 2024/001-RJ coletado com sucesso', timestamp: '2024-01-27 10:30' },
    { id: 2, mensagem: 'Análise LLM concluída para documento DOC-456', timestamp: '2024-01-27 09:15' },
    { id: 3, mensagem: 'Download de 5 documentos finalizado', timestamp: '2024-01-27 08:45' },
    { id: 4, mensagem: 'Processo 2024/002-RJ atualizado', timestamp: '2024-01-26 16:20' },
    { id: 5, mensagem: 'Sistema de análise LLM otimizado', timestamp: '2024-01-26 14:10' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard - SEI-Com AI
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Modo Demonstração:</strong> Esta é uma versão de teste com dados simulados. 
        As páginas implementadas incluem componentes funcionais, navegação e design responsivo.
      </Alert>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="h6">
                Processos
              </Typography>
              <Typography variant="h4" color="white">
                {stats.total_processos}
              </Typography>
              <Typography color="white" variant="body2">
                Total coletados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="h6">
                Documentos
              </Typography>
              <Typography variant="h4" color="white">
                {stats.total_documentos}
              </Typography>
              <Typography color="white" variant="body2">
                Total armazenados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="h6">
                Analisados
              </Typography>
              <Typography variant="h4" color="white">
                {stats.documentos_analisados}
              </Typography>
              <Typography color="white" variant="body2">
                Por IA (LLM)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)' }}>
            <CardContent>
              <Typography color="white" gutterBottom variant="h6">
                Custos LLM
              </Typography>
              <Typography variant="h4" color="white">
                R$ {stats.custo_total_llm.toFixed(2)}
              </Typography>
              <Typography color="white" variant="body2">
                Total investido
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Processos Recentes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">
              📂 Processos Recentes
            </Typography>
            
            {processosRecentes.map((processo) => (
              <Box 
                key={processo.id} 
                sx={{ 
                  mb: 2, 
                  pb: 2, 
                  borderBottom: '1px solid #eee',
                  '&:hover': { 
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    p: 1,
                    m: -1,
                    mb: 1,
                  },
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <Typography variant="body1" fontWeight="medium" color="primary">
                  {processo.numero}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {processo.assunto}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Atividades Recentes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="secondary">
              🔄 Atividades Recentes
            </Typography>
            
            {atividades.map((atividade) => (
              <Box key={atividade.id} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • {atividade.mensagem}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {atividade.timestamp}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Informações de Desenvolvimento */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          🚀 Status do Desenvolvimento
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>✅ Implementado:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1 }}>
              <li>StatusChip - Componente de status com cores</li>
              <li>ProcessCard - Card completo para processos</li>
              <li>SearchBar - Busca global integrada</li>
              <li>Layout responsivo com navegação</li>
              <li>Dashboard funcional (esta página)</li>
              <li>Lista de processos com filtros</li>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>🔄 Próximos Passos:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1 }}>
              <li>Páginas de detalhes de processos</li>
              <li>Formulários de criação/edição</li>
              <li>Integração completa com API</li>
              <li>Gráficos e visualizações</li>
              <li>Sistema de notificações</li>
              <li>Temas dark/light</li>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard; 