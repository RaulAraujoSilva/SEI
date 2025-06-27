import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
} from '@mui/material';

const Dashboard: React.FC = () => {
  // Dados mock para teste inicial
  const isLoading = false;
  const error = null;
  
  const stats = {
    total_processos: 15,
    total_documentos: 127,
    documentos_analisados: 89,
    custo_total_llm: 45.67,
    taxa_sucesso: 92.5,
  };
  
  const atividades = [
    { id: 1, mensagem: 'Processo 2024/001 coletado', timestamp: '2024-01-15 10:30' },
    { id: 2, mensagem: 'Análise LLM concluída - Doc 456', timestamp: '2024-01-15 09:15' },
    { id: 3, mensagem: 'Novo processo adicionado', timestamp: '2024-01-15 08:45' },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">
          Erro ao carregar dados do dashboard
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Processos
              </Typography>
              <Typography variant="h4">
                {stats.total_processos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Documentos
              </Typography>
              <Typography variant="h4">
                {stats.total_documentos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Analisados
              </Typography>
              <Typography variant="h4">
                {stats.documentos_analisados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Custos LLM
              </Typography>
              <Typography variant="h4">
                R$ {stats.custo_total_llm.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Atividades Recentes
        </Typography>
        
        {atividades.length > 0 ? (
          atividades.map((atividade) => (
            <Box key={atividade.id} sx={{ mb: 1 }}>
              <Typography variant="body2">
                • {atividade.mensagem} ({atividade.timestamp})
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            Nenhuma atividade recente
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard; 