import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { brand } from '../../shared-theme/themePrimitives';

const BrandTextField: React.FC<TextFieldProps> = (props) => {
  const { sx, ...otherProps } = props;
  return (
    <TextField
      {...otherProps}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: brand[300],
          },
          '&:hover fieldset': {
            borderColor: brand[500],
          },
          '&.Mui-focused fieldset': {
            borderColor: brand[700],
          },
        },
        '& .MuiInputLabel-root': {
          color: brand[700],
          '&.Mui-focused': {
            color: brand[700],
          },
        },
        ...sx,
      }}
    />
  );
};

export default BrandTextField;
