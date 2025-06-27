import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as ProcessosIcon,
  InsertDriveFile as DocumentosIcon,
  Psychology as LLMIcon,
  Add as NovoProcessoIcon,
  Settings as ConfiguracoesIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../SearchBar';

const DRAWER_WIDTH = 240;

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/processos', label: 'Processos', icon: <ProcessosIcon /> },
  { path: '/documentos', label: 'Documentos', icon: <DocumentosIcon /> },
  { path: '/llm', label: 'Análises LLM', icon: <LLMIcon /> },
  { path: '/novo-processo', label: 'Novo Processo', icon: <NovoProcessoIcon /> },
  { path: '/configuracoes', label: 'Configurações', icon: <ConfiguracoesIcon /> },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          SEI-Com AI
        </Typography>
      </Toolbar>
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleMenuClick(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ flexGrow: { xs: 1, sm: 0 }, mr: { sm: 2 } }}
          >
            Sistema de Análise Inteligente
          </Typography>

          {/* Barra de Busca - Desktop */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              maxWidth: 400, 
              display: { xs: 'none', sm: 'block' },
              mx: 2 
            }}
          >
            <SearchBar 
              size="small" 
              placeholder="Buscar processos, documentos..."
              fullWidth
            />
          </Box>

          {/* Espaço flexível para empurrar elementos para a direita */}
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>

        {/* Barra de Busca - Mobile (abaixo do toolbar principal) */}
        <Box 
          sx={{ 
            display: { xs: 'block', sm: 'none' },
            px: 2, 
            pb: 1 
          }}
        >
          <SearchBar 
            size="small" 
            placeholder="Buscar..."
            fullWidth
          />
        </Box>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          // Adiciona espaço extra no mobile devido à SearchBar
          mt: { xs: 1, sm: 0 },
        }}
      >
        <Toolbar />
        {/* Espaço adicional no mobile para a SearchBar */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, height: 16 }} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 