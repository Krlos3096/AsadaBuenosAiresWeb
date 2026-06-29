import React, { useEffect } from 'react';
import {
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import { useDialog } from '../../context/DialogContext';
import { useTranslation } from '../../context/TranslationContext';
import DynamicItemsInput from '../DynamicItemsInput/DynamicItemsInput';
import { DataService } from '../../services/dataService';
import { brand } from '../../shared-theme/themePrimitives';

export interface AddEditStatDialogProps {
  onSave: () => Promise<void>;
  initialLabel?: string;
  initialChartData?: Array<{ label: string; value: number }>;
  statId?: string;
  sortOrder?: number;
  mode?: 'add' | 'edit';
}

export default function AddEditStatDialog({ 
  onSave, 
  initialLabel = '', 
  initialChartData = [], 
  statId,
  sortOrder = 1,
  mode = 'edit' 
}: AddEditStatDialogProps) {
  const [formData, setFormData] = React.useState<{
    label: string;
    chartData: Array<{ label: string; value: number }>;
  }>({
    label: initialLabel,
    chartData: initialChartData,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const { t } = useTranslation();
  const { closeDialog } = useDialog();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setFormData({
      label: initialLabel,
      chartData: initialChartData,
    });
    setErrors({});
  }, []); // Only run on mount, not when props change

  const handleChange = (name: string, value: string | Array<{ label: string; value: number }>) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.label || formData.label.trim() === '') {
      newErrors.label = 'El label es requerido';
    }
    
    if (!formData.chartData || formData.chartData.length === 0) {
      newErrors.chartData = 'Se requiere al menos un dato en el gráfico';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const jsonData = JSON.stringify(formData.chartData);
      
      if (mode === 'edit' && statId) {
        await DataService.updateStat(statId, jsonData, formData.label, sortOrder);
      } else if (mode === 'add') {
        await DataService.createStat(jsonData, formData.label, sortOrder);
      }
      
      await onSave();
      closeDialog();
    } catch (error) {
      console.error('Error al guardar:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              required
              error={!!errors.label}
              helperText={errors.label}
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
          </Box>
          <Box>
            <DynamicItemsInput
              label="Datos del Gráfico"
              mode="chart"
              chartData={formData.chartData}
              onChartDataChange={(data) => handleChange('chartData', data)}
            />
            {errors.chartData && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errors.chartData}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ width: '100%', mb: 1 }}>
          {Object.keys(errors).length > 0 && (
            <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} role="alert">
              {t.validation.errorsInFields}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 1 }}>
          <Button disabled={isSaving} onClick={closeDialog} sx={{ color: brand[700], '&:hover': { backgroundColor: brand[50] } }}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving}
            sx={{ backgroundColor: brand[700], '&:hover': { backgroundColor: brand[900] } }}
          >
            {isSaving ? t.common.loading : mode === 'add' ? t.common.add : t.common.save}
          </Button>
        </Box>
      </DialogActions>
    </Box>
  );
}
