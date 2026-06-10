import React from 'react';
import { Radio, RadioProps } from '@mui/material';
import { brand } from '../../shared-theme/themePrimitives';

const BrandRadio: React.FC<RadioProps> = (props) => {
  const { sx, ...otherProps } = props;
  
  return (
    <Radio
      {...otherProps}
      sx={{
        color: brand[500],
        '&.Mui-checked': {
          color: brand[700],
        },
        '&:hover': {
          color: brand[600],
        },
        ...sx,
      }}
    />
  );
};

export default BrandRadio;
