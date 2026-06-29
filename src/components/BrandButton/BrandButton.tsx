import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { brand } from '../../shared-theme/themePrimitives';

const BrandButton: React.FC<ButtonProps> = (props) => {
  const { sx, variant, ...otherProps } = props;
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'contained':
        return {
          backgroundColor: brand[700],
          '&:hover': {
            backgroundColor: brand[900],
          },
        };
      case 'outlined':
        return {
          color: brand[700],
          borderColor: brand[300],
          '&:hover': {
            borderColor: brand[700],
            backgroundColor: brand[50],
          },
        };
      case 'text':
        return {
          color: brand[700],
          '&:hover': {
            color: brand[900],
            backgroundColor: brand[50],
          },
        };
      default:
        return {};
    }
  };

  return (
    <Button
      {...otherProps}
      variant={variant}
      sx={{
        ...getVariantStyles(),
        ...sx,
      }}
    />
  );
};

export default BrandButton;
