import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { brand } from '../../shared-theme/themePrimitives';

interface LoginDialogProps {
  onSuccess?: () => void;
}

const LoginDialogContent: React.FC<LoginDialogProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          py: 2
        }}
      >        
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TextField
          label={t.auth.username}
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoFocus
          autoComplete="username"
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
              color: brand[500],
              '&.Mui-focused': {
                color: brand[600],
              },
            },
          }}
        />

        <TextField
          label={t.auth.password}
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={isLoading}
                  aria-label="toggle password visibility"
                  sx={{ opacity: isLoading ? 0.5 : 1 }}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& input::-ms-reveal': {
              display: 'none',
            },
            '& input::-webkit-credentials-auto-fill-button': {
              display: 'none',
            },
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
              color: brand[500],
              '&.Mui-focused': {
                color: brand[600],
              },
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isLoading || !username || !password}
          sx={{
            mt: 2,
            backgroundColor: brand[500],
            color: brand[50],
            '&:hover': {
              backgroundColor: brand[700],
            },
            '&:disabled': {
              backgroundColor: brand[300],
            },
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : t.auth.login}
        </Button>
      </Box>
    </Container>
  );
};

export default LoginDialogContent;
