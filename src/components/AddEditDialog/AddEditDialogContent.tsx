import React, { useEffect } from 'react';
import {
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Stack,
} from '@mui/material';
import { useDialog } from '../../context/DialogContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import ImageUpload from '../ImageUpload/ImageUpload';
import DynamicItemsInput from '../DynamicItemsInput/DynamicItemsInput';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelIcon from '@mui/icons-material/Gavel';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import { brand } from '../../shared-theme/themePrimitives';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';

// Icon mapping for dropdown display
const iconComponentMap: Record<string, React.ElementType> = {
  Groups: GroupsIcon,
  Gavel: GavelIcon,
  AccountBalance: AccountBalanceIcon,
  Description: DescriptionIcon,
  Assignment: AssignmentIcon,
  Payment: PaymentIcon,
  Receipt: ReceiptIcon,
  WaterDrop: WaterDropIcon,
  Phone: PhoneIcon,
  Email: EmailIcon,
  LocationOn: LocationOnIcon,
};

export type ContentType = 'news' | 'service' | 'governance' | 'contact' | 'carousel' | 'timeline' | 'mission' | 'vision' | 'stats' | 'contactFloat';

export interface AddEditDialogContentProps {
  onSave: (data: any) => Promise<void>;
  contentType: ContentType;
  initialData?: any;
  mode?: 'add' | 'edit';
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'image' | 'date' | 'items';
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  options?: { value: string; label: string }[];
}

const getFormFields = (contentType: ContentType): FormField[] => {
  switch (contentType) {
    case 'news':
      return [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'subtitle', label: 'Subtítulo', type: 'text' },
        { name: 'description', label: 'Descripción', type: 'textarea', multiline: true, rows: 4, required: true },
        { name: 'image', label: 'Imagen', type: 'image' },
        { name: 'tag', label: 'Etiqueta', type: 'text' },
        { name: 'date', label: 'Fecha', type: 'date', required: true },
      ];
    case 'service':
    case 'governance':
      return [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'subtitle', label: 'Subtítulo', type: 'text' },
        { name: 'description', label: 'Descripción', type: 'textarea', multiline: true, rows: 4 },
        { name: 'image', label: 'Imagen', type: 'image' },
        { name: 'icon', label: 'Icono', type: 'select', required: true, options: [
          { value: 'Groups', label: 'Grupos' },
          { value: 'Gavel', label: 'Martillo' },
          { value: 'AccountBalance', label: 'Balance' },
          { value: 'Description', label: 'Descripción' },
          { value: 'Assignment', label: 'Asignación' },
          { value: 'Payment', label: 'Pago' },
          { value: 'Receipt', label: 'Recibo' },
          { value: 'WaterDrop', label: 'Gota de agua' },
        ]},
        { name: 'items', label: 'Lista de Elementos', type: 'items' },
        { name: 'url', label: 'Redireccion a URL', type: 'text' },
      ];
    case 'contact':
      return [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'subtitle', label: 'Subtítulo', type: 'text' },
        { name: 'description', label: 'Descripción', type: 'textarea', multiline: true, rows: 4 },
        { name: 'icon', label: 'Icono', type: 'select', required: true, options: [
          { value: 'Phone', label: 'Teléfono' },
          { value: 'Email', label: 'Correo' },
          { value: 'LocationOn', label: 'Ubicación' },
        ]},
        { name: 'googleMapsUrl', label: 'URL de Google Maps', type: 'text' },
      ];
    case 'carousel':
      return [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'subtitle', label: 'Subtítulo', type: 'text' },
        { name: 'description', label: 'Descripción', type: 'textarea', multiline: true, rows: 3 },
        { name: 'image', label: 'Imagen', type: 'image', required: true },
      ];
    case 'timeline':
      return [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'year', label: 'Año', type: 'text', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea', multiline: true, rows: 4 },
        { name: 'image', label: 'Imagen', type: 'image' },
      ];
    case 'mission':
    case 'vision':
      return [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'content', label: 'Contenido', type: 'textarea', multiline: true, rows: 6, required: true },
      ];
    case 'stats':
      return [
        { name: 'number', label: 'Número', type: 'text', required: true },
        { name: 'label', label: 'Etiqueta', type: 'text', required: true },
      ];
    case 'contactFloat':
      return [
        { name: 'value', label: 'Valor', type: 'text', required: true },
      ];
    default:
      return [];
  }
};

export default function AddEditDialogContent({ onSave, contentType, initialData, mode = 'add' }: AddEditDialogContentProps) {
  const [formData, setFormData] = React.useState<any>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [filesToUpload, setFilesToUpload] = React.useState<Record<string, File>>({});
  const [filesToDelete, setFilesToDelete] = React.useState<string[]>([]);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { closeDialog } = useDialog();

  const formFields = getFormFields(contentType);

  useEffect(() => {
    setFormData(initialData || {});
    setErrors({});
    setFilesToDelete([]);
    setFilesToUpload({});
  }, [initialData]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field: string, file: File | null, oldKey: string | undefined) => {
    if (file) {
      // Track new file for upload
      setFilesToUpload(prev => ({ ...prev, [field]: file }));
      // Track old key for deletion
      if (oldKey) {
        setFilesToDelete(prev => [...prev, oldKey]);
      }
    } else {
      // File was deleted, track old key for deletion
      if (oldKey) {
        setFilesToDelete(prev => [...prev, oldKey]);
      }
      setFilesToUpload(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleItemFileChange = (index: number, file: File | null, oldKey: string | undefined) => {
    if (file) {
      // Track item file for upload with a unique key
      const field = `item_${index}`;
      setFilesToUpload(prev => ({ ...prev, [field]: file }));
      // Track old key for deletion
      if (oldKey) {
        setFilesToDelete(prev => [...prev, oldKey]);
      }
    } else {
      // File was deleted, track old key for deletion
      if (oldKey) {
        setFilesToDelete(prev => [...prev, oldKey]);
      }
      const field = `item_${index}`;
      setFilesToUpload(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleItemFilesToDelete = (fileUrls: string[]) => {
    setFilesToDelete(prev => [...prev, ...fileUrls]);
  };

  const deleteFilesFromR2 = async (fileUrls: string[]): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const deletePromises = fileUrls.map(async (fileUrl) => {
      try {
        await fetch(`${API_URL}/files/${fileUrl}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Error al eliminar archivo:', fileUrl, error);
      }
    });

    await Promise.all(deletePromises);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    formFields.forEach(field => {
      const hasPendingUpload = filesToUpload[field.name] !== undefined;
      const hasValue = formData[field.name] !== undefined && formData[field.name] !== '';
      if (field.required && !hasValue && !hasPendingUpload) {
        newErrors[field.name] = `${field.label} ${t.common.required}`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Upload new files first
      const uploadPromises = Object.entries(filesToUpload).map(async ([field, file]) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t.errors.uploadError);
        }

        const data = await response.json();
        return { field, key: data.key };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Update formData with uploaded file keys
      const updatedFormData = { ...formData };
      uploadedFiles.forEach(({ field, key }) => {
        if (field.startsWith('item_')) {
          // This is an item file, update the items array
          const index = parseInt(field.replace('item_', ''));
          if (updatedFormData.items && updatedFormData.items[index] !== undefined) {
            const parts = updatedFormData.items[index].split('|');
            parts[1] = key; // Replace the file key
            updatedFormData.items[index] = parts.join('|');
          }
        } else {
          // This is a regular field
          updatedFormData[field] = key;
        }
      });

      // Delete old files marked for deletion
      if (filesToDelete.length > 0) {
        await deleteFilesFromR2(filesToDelete);
      }

      // Add author when creating new items
      if (mode === 'add' && user) {
        updatedFormData.author = user.username;
      }

      // Save the card data with updated file keys
      await onSave(updatedFormData);
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
          {formFields.map((field) => (
            <Box key={field.name}>
              {field.type === 'textarea' ? (
                <TextField
                  fullWidth
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  multiline
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
                  }}
                  rows={field.rows || 4}
                />
              ) : field.type === 'select' ? (
                <TextField
                  fullWidth
                  select
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: brand[300],
                      },
                      '&:hover fieldset': {
                    '& .MuiInputLabel-root': {
                      color: brand[700],
                      '&.Mui-focused': {
                        color: brand[700],
                      },
                    },
                        borderColor: brand[500],
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: brand[700],
                      },
                    },
                  }}
                >
                  {field.options?.map((option) => {
                    const IconComponent = iconComponentMap[option.value];
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {IconComponent && <IconComponent />}
                          {option.label}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </TextField>
              ) : field.type === 'items' ? (
                <DynamicItemsInput
                  label={field.label}
                  value={formData.items || []}
                  onChange={(items) => setFormData((prev: any) => ({ ...prev, items }))}
                  placeholder="Ingresa un valor"
                  onFilesToDelete={handleItemFilesToDelete}
                  onItemFileChange={handleItemFileChange}
                />
              ) : field.type === 'date' ? (
                <TextField
                  fullWidth
                  type="date"
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
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
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              ) : field.type === 'image' ? (
                <ImageUpload
                  value={formData[field.name]}
                  onChange={(key: string | undefined) => handleChange(field.name, key || '')}
                  label={field.label}
                  error={errors[field.name]}
                  onFileChange={(file, oldKey) => handleFileChange(field.name, file, oldKey)}
                />
              ) : (
                <TextField
                  fullWidth
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
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
                  }}
                />
              )}
            </Box>
          ))}
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
};
