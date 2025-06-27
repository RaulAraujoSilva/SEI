import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="400px"
      textAlign="center"
    >
      <Typography variant="h1" color="primary" sx={{ fontSize: '6rem', mb: 2 }}>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Página não encontrada
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        A página que você procura não existe ou foi movida.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/dashboard')}
      >
        Voltar ao Dashboard
      </Button>
    </Box>
  );
};

export default NotFound; 