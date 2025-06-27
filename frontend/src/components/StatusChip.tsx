import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { StatusType } from '../types';

interface StatusChipProps {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  label, 
  size = 'small' 
}) => {
  const getStatusProps = (status: StatusType): Pick<ChipProps, 'color' | 'variant'> => {
    switch (status) {
      case 'concluido':
        return { color: 'success', variant: 'filled' };
      case 'pendente':
        return { color: 'warning', variant: 'filled' };
      case 'processando':
        return { color: 'info', variant: 'filled' };
      case 'erro':
        return { color: 'error', variant: 'filled' };
      default:
        return { color: 'default', variant: 'outlined' };
    }
  };

  const getStatusLabel = (status: StatusType): string => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'pendente':
        return 'Pendente';
      case 'processando':
        return 'Processando';
      case 'erro':
        return 'Erro';
      default:
        return status;
    }
  };

  const statusProps = getStatusProps(status);
  const displayLabel = label || getStatusLabel(status);

  return (
    <Chip
      label={displayLabel}
      size={size}
      {...statusProps}
      sx={{
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        height: size === 'small' ? 24 : 32,
      }}
    />
  );
};

export default StatusChip; 