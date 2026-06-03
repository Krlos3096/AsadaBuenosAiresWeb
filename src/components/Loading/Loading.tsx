import * as React from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';

// Water drop jumping animation
const bounce = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateY(-20px) scale(1.1);
    opacity: 0.8;
  }
`;

// Ripple animation
const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = 'Cargando...' }: LoadingProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Water drop */}
        <Box
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #1f7a1f 0%, #0077B6 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            animation: `${bounce} 1s ease-in-out infinite`,
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 4px 8px rgba(4, 166, 219, 0.3)',
          }}
        />
        {/* Ripple effect */}
        <Box
          sx={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid #1f7a1f',
            animation: `${ripple} 1.5s ease-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid #1f7a1f',
            animation: `${ripple} 1.5s ease-out infinite 0.5s`,
          }}
        />
      </Box>
      <Box
        sx={{
          fontSize: '1.2rem',
          color: 'text.secondary',
          fontWeight: 500,
          animation: `${bounce} 1s ease-in-out infinite 0.3s`,
        }}
      >
        {message}
      </Box>
    </Box>
  );
}
