import React, { useState, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Description as DocumentIcon,
  Folder as ProcessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Processo, Documento } from '../types';

interface SearchBarProps {
  placeholder?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

interface SearchResults {
  processos: Processo[];
  documentos: Documento[];
  total: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar processos, documentos...',
  size = 'medium',
  fullWidth = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.buscaGlobal(searchQuery);
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults(null);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget);
    if (results && query.length >= 2) {
      setShowResults(true);
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setAnchorEl(null);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
  };

  const handleProcessoClick = (processo: Processo) => {
    navigate(`/processos/${processo.id}`);
    handleClose();
  };

  const handleDocumentoClick = (documento: Documento) => {
    navigate(`/documentos/${documento.id}`);
    handleClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter' && query.length >= 2) {
      // Navegar para página de resultados completos
      navigate(`/busca?q=${encodeURIComponent(query)}`);
      handleClose();
    }
  };

  return (
    <Box position="relative">
      <TextField
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        size={size}
        fullWidth={fullWidth}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon color="action" />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          },
        }}
      />

      {/* Menu de resultados */}
      <Menu
        anchorEl={anchorEl}
        open={showResults}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: anchorEl?.clientWidth || 400,
            maxWidth: 500,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {results ? (
          <>
            {/* Header com total */}
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {results.total} resultado(s) encontrado(s)
              </Typography>
            </MenuItem>
            <Divider />

            {/* Processos */}
            {results.processos.length > 0 && (
              <>
                <MenuItem disabled>
                  <Typography variant="subtitle2" color="primary">
                    Processos
                  </Typography>
                </MenuItem>
                {results.processos.slice(0, 3).map((processo) => (
                  <MenuItem
                    key={`processo-${processo.id}`}
                    onClick={() => handleProcessoClick(processo)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <ProcessIcon fontSize="small" color="primary" />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {processo.numero}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {processo.tipo}
                        </Typography>
                      </Box>
                      <Chip
                        label={processo.tipo}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
                {results.processos.length > 3 && (
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary">
                      +{results.processos.length - 3} processos...
                    </Typography>
                  </MenuItem>
                )}
              </>
            )}

            {/* Documentos */}
            {results.documentos.length > 0 && (
              <>
                {results.processos.length > 0 && <Divider />}
                <MenuItem disabled>
                  <Typography variant="subtitle2" color="secondary">
                    Documentos
                  </Typography>
                </MenuItem>
                {results.documentos.slice(0, 3).map((documento) => (
                  <MenuItem
                    key={`documento-${documento.id}`}
                    onClick={() => handleDocumentoClick(documento)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <DocumentIcon fontSize="small" color="secondary" />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {documento.numero_documento}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {documento.tipo}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
                {results.documentos.length > 3 && (
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary">
                      +{results.documentos.length - 3} documentos...
                    </Typography>
                  </MenuItem>
                )}
              </>
            )}

            {/* Ver todos os resultados */}
            {results.total > 6 && (
              <>
                <Divider />
                <MenuItem
                  onClick={() => {
                    navigate(`/busca?q=${encodeURIComponent(query)}`);
                    handleClose();
                  }}
                >
                  <Typography variant="body2" color="primary">
                    Ver todos os {results.total} resultados
                  </Typography>
                </MenuItem>
              </>
            )}

            {/* Nenhum resultado */}
            {results.total === 0 && (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  Nenhum resultado encontrado
                </Typography>
              </MenuItem>
            )}
          </>
        ) : (
          query.length >= 2 && !loading && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                Digite pelo menos 2 caracteres para buscar
              </Typography>
            </MenuItem>
          )
        )}
      </Menu>
    </Box>
  );
};

export default SearchBar; 