import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Description as DocumentIcon,
  Assessment as AnalyzeIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Processo } from '../types';
import StatusChip from './StatusChip';

interface ProcessCardProps {
  processo: Processo;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAnalyze?: (id: number) => void;
}

const ProcessCard: React.FC<ProcessCardProps> = ({
  processo,
  onView,
  onEdit,
  onDelete,
  onAnalyze,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('Administrativo') || tipo.includes('PAD')) return 'primary';
    if (tipo.includes('Licitação') || tipo.includes('Pregão')) return 'success';
    if (tipo.includes('Legislativa') || tipo.includes('Lei')) return 'info';
    if (tipo.includes('Contratual') || tipo.includes('Revisão')) return 'warning';
    if (tipo.includes('Improbidade') || tipo.includes('Ação')) return 'error';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header com número */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" noWrap sx={{ maxWidth: '100%' }}>
            {processo.numero}
          </Typography>
        </Box>

        {/* Tipo do processo */}
        <Box mb={1}>
          <Chip
            label={processo.tipo}
            color={getTipoColor(processo.tipo) as any}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Interessados */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Interessados:</strong> {processo.interessados}
        </Typography>

        {/* Localização atual */}
        {processo.localizacao_atual && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Localização:</strong> {processo.localizacao_atual}
          </Typography>
        )}

        {/* Observação do usuário */}
        {processo.observacao_usuario && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Observação:</strong> {processo.observacao_usuario}
          </Typography>
        )}

        {/* Informações adicionais */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {formatDate(processo.data_geracao)}
            </Typography>
          </Box>
        </Box>

        {/* Métricas de documentos */}
        {(processo.total_documentos !== undefined || processo.documentos_analisados !== undefined) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocumentIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {processo.total_documentos || 0} docs
                {processo.documentos_analisados !== undefined && 
                  ` • ${processo.documentos_analisados} analisados`
                }
              </Typography>
            </Box>
          </>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => onView(processo.id)}
        >
          Visualizar
        </Button>

        <IconButton
          size="small"
          onClick={handleMenuOpen}
          aria-label="mais opções"
        >
          <MoreIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleAction(() => onEdit(processo.id))}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
          
          {onAnalyze && (
            <MenuItem onClick={() => handleAction(() => onAnalyze!(processo.id))}>
              <AnalyzeIcon fontSize="small" sx={{ mr: 1 }} />
              Analisar
            </MenuItem>
          )}
          
          <MenuItem 
            onClick={() => handleAction(() => onDelete(processo.id))}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Excluir
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
};

export default ProcessCard; 