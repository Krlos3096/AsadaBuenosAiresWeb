import React from 'react';
import { IconButton, IconButtonProps } from '@mui/material';
import { brand } from '../../shared-theme/themePrimitives';

const BrandIconButton: React.FC<IconButtonProps> = (props) => {
  const { sx, ...otherProps } = props;
  
  return (
    <IconButton
      {...otherProps}
      sx={{
        color: brand[700],
        '&:hover': {
          color: brand[900],
        },
        ...sx,
      }}
    />
  );
};

export default BrandIconButton;
