import React, { useState } from 'react';
import {
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import { DataService } from '../../services/dataService';
import { brand } from '../../shared-theme/themePrimitives';

interface ComplaintFormProps {
  to: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ to, onSuccess, onCancel }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      await DataService.sendComplaint(to, message);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al enviar la queja');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box>
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Enviando queja a: {to}
          </Typography>
          <TextField
            fullWidth
            label="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            error={!!error}
            helperText={error}
            multiline
            rows={6}
            placeholder="Escriba su queja aquí..."
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 1 }}>
          <Button
            disabled={isSending}
            onClick={onCancel}
            sx={{ color: brand[700], '&:hover': { backgroundColor: brand[50] } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSending}
            sx={{ backgroundColor: brand[700], '&:hover': { backgroundColor: brand[900] } }}
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </Box>
      </DialogActions>
    </Box>
  );
};

export default ComplaintForm;
