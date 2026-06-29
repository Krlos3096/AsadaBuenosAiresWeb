import React, { useState } from 'react';
import { Box, TextField, IconButton, Stack, Radio, RadioGroup, FormControlLabel, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from '../FileUpload/FileUpload';
import LinkIcon from '@mui/icons-material/Link';
import { useTranslation } from '../../context/TranslationContext';
import { brand } from '../../shared-theme/themePrimitives';

export interface DynamicItemsInputProps {
  label?: string;
  value?: string[];
  onChange?: (items: string[]) => void;
  placeholder?: string;
  onFilesToDelete?: (fileUrls: string[]) => void;
  onItemFileChange?: (index: number, file: File | null, oldKey: string | undefined) => void;
  mode?: 'default' | 'chart';
  chartData?: Array<{ label: string; value: number }>;
  onChartDataChange?: (data: Array<{ label: string; value: number }>) => void;
}

const DynamicItemsInput: React.FC<DynamicItemsInputProps> = ({
  label,
  value = [],
  onChange,
  placeholder = 'Ingresa un valor',
  onFilesToDelete,
  onItemFileChange,
  mode = 'default',
  chartData = [],
  onChartDataChange
}) => {
  const { t } = useTranslation();
  // Internal state to track file URLs for each item
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
  // Internal state to track input type (file or url) for each item
  const [inputTypes, setInputTypes] = useState<Record<number, 'file' | 'url'>>({});
  // Track original file URLs to know which ones to delete
  const [originalFileUrls, setOriginalFileUrls] = useState<Record<number, string>>({});
  // Track local files for each item
  const [localFiles, setLocalFiles] = useState<Record<number, File>>({});

  // Chart mode handlers
  const handleChartLabelChange = (index: number, newLabel: string) => {
    const updatedData = [...chartData];
    updatedData[index] = { ...updatedData[index], label: newLabel };
    if (onChartDataChange) onChartDataChange(updatedData);
  };

  const handleChartValueChange = (index: number, newValue: string) => {
    const updatedData = [...chartData];
    const numValue = Number(newValue);
    updatedData[index] = { ...updatedData[index], value: isNaN(numValue) ? 0 : numValue };
    if (onChartDataChange) onChartDataChange(updatedData);
  };

  const handleChartDateChange = (index: number, dateString: string) => {
    handleChartLabelChange(index, dateString);
  };

  const handleChartAdd = () => {
    const updatedData = [...chartData, { label: '', value: 0 }];
    if (onChartDataChange) onChartDataChange(updatedData);
  };

  const handleChartRemove = (index: number) => {
    const updatedData = chartData.filter((_, i) => i !== index);
    if (onChartDataChange) onChartDataChange(updatedData);
  };

  // Render chart mode
  if (mode === 'chart') {
    return (
      <Box>
        {label && (
          <Box sx={{ mb: 1 }}>
            <label style={{ fontWeight: 500 }}>{label}</label>
          </Box>
        )}
        <Stack spacing={2}>
          {chartData.map((item, index) => (
            <Box key={`chart-item-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Etiqueta"
                value={item.label}
                onChange={(e) => handleChartDateChange(index, e.target.value)}
                size="small"
                fullWidth
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
                }}
              />
              <TextField
                label="Valor"
                value={item.value}
                onChange={(e) => handleChartValueChange(index, e.target.value)}
                size="small"
                sx={{
                  width: 120,
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
                }}
              />
              <IconButton
                onClick={() => handleChartRemove(index)}
                size="small"
                sx={{ color: brand[700], '&:hover': { color: brand[900] } }}
                aria-label={t.common.delete}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <IconButton
            onClick={handleChartAdd}
            sx={{ alignSelf: 'flex-start', color: brand[700], '&:hover': { color: brand[900] } }}
          >
            <AddIcon />
          </IconButton>
        </Stack>
      </Box>
    );
  }

  // Parse text from pipe-delimited string
  const parseText = (str: string): string => {
    return str.split('|')[0];
  };

  // Parse file URL from pipe-delimited string
  const parseFileUrl = (str: string): string | undefined => {
    const parts = str.split('|');
    return parts.length > 1 ? parts[1] : undefined;
  };

  // Join text and file URL with pipe
  const joinTextAndFile = (text: string, fileUrl?: string): string => {
    if (fileUrl) {
      return `${text}|${fileUrl}`;
    }
    return text;
  };

  // Determine if a URL is external (starts with http/https)
  const isExternalUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleChange = (index: number, newText: string) => {
    const fileUrl = fileUrls[index] || parseFileUrl(value[index]);
    const updatedItems = [...value];
    updatedItems[index] = joinTextAndFile(newText, fileUrl);
    onChange?.(updatedItems);
  };

  const handleFileChange = (index: number, fileUrl: string | undefined) => {
    const updatedFileUrls = { ...fileUrls, [index]: fileUrl || '' };
    setFileUrls(updatedFileUrls);

    const text = parseText(value[index]);
    const updatedItems = [...value];
    updatedItems[index] = joinTextAndFile(text, fileUrl);
    onChange?.(updatedItems);
  };

  const handleItemFileChange = (index: number, file: File | null, oldKey: string | undefined) => {
    if (file) {
      // Track local file for upload
      setLocalFiles(prev => ({ ...prev, [index]: file }));
      // Track old key for deletion
      if (oldKey && !isExternalUrl(oldKey)) {
        if (onFilesToDelete) {
          onFilesToDelete([oldKey]);
        }
      }
    } else {
      // File was deleted, track old key for deletion
      if (oldKey && !isExternalUrl(oldKey)) {
        if (onFilesToDelete) {
          onFilesToDelete([oldKey]);
        }
      }
      setLocalFiles(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }

    // Also notify parent component for upload tracking
    if (onItemFileChange) {
      onItemFileChange(index, file, oldKey);
    }
  };

  const handleUrlChange = (index: number, url: string) => {
    const updatedFileUrls = { ...fileUrls, [index]: url };
    setFileUrls(updatedFileUrls);

    const text = parseText(value[index]);
    const updatedItems = [...value];
    updatedItems[index] = joinTextAndFile(text, url);
    onChange?.(updatedItems);
  };

  const handleInputTypeChange = (index: number, type: 'file' | 'url') => {
    const currentType = inputTypes[index] || 'file';
    const currentFileUrl = fileUrls[index] || parseFileUrl(value[index]);

    // If switching from file to URL and there's an R2 file, mark it for deletion
    if (currentType === 'file' && type === 'url' && currentFileUrl && !isExternalUrl(currentFileUrl)) {
      if (onFilesToDelete) {
        onFilesToDelete([currentFileUrl]);
      }
    }

    const updatedInputTypes = { ...inputTypes, [index]: type };
    setInputTypes(updatedInputTypes);

    // Don't clear the file/url when switching types, just change the type
    // This allows users to toggle between views without losing their data
  };

  const handleAdd = () => {
    onChange?.([...value, '']);
  };

  const handleRemove = (index: number) => {
    const currentFileUrl = fileUrls[index] || parseFileUrl(value[index]);

    // Track file for deletion (will be deleted on save)
    if (currentFileUrl && !isExternalUrl(currentFileUrl)) {
      if (onFilesToDelete) {
        onFilesToDelete([currentFileUrl]);
      }
    }

    const updatedItems = value.filter((_, i) => i !== index);
    const updatedFileUrls = { ...fileUrls };
    delete updatedFileUrls[index];
    setFileUrls(updatedFileUrls);

    const updatedInputTypes = { ...inputTypes };
    delete updatedInputTypes[index];
    setInputTypes(updatedInputTypes);

    const updatedOriginalFileUrls = { ...originalFileUrls };
    delete updatedOriginalFileUrls[index];
    setOriginalFileUrls(updatedOriginalFileUrls);

    const updatedLocalFiles = { ...localFiles };
    delete updatedLocalFiles[index];
    setLocalFiles(updatedLocalFiles);

    onChange?.(updatedItems);
  };

  return (
    <Box>
      {label && (
        <Box sx={{ mb: 1 }}>
          <label style={{ fontWeight: 500 }}>{label}</label>
        </Box>
      )}
      <Stack spacing={2}>
        {value.map((item, index) => {
          const currentInputType = inputTypes[index] || 'file';
          const currentFileUrl = fileUrls[index] || parseFileUrl(item);

          return (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  value={parseText(item)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={placeholder}
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
                  size="small"
                />
                <IconButton
                  onClick={() => handleRemove(index)}
                  size="small"
                  sx={{ mt: 0.5, color: brand[700], '&:hover': { color: brand[900] } }}
                  aria-label={t.common.delete}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <RadioGroup
                row
                value={currentInputType}
                onChange={(e) => handleInputTypeChange(index, e.target.value as 'file' | 'url')}
                sx={{ alignItems: 'center' }}
              >
                <FormControlLabel
                  value="file"
                  control={<Radio
                    size="small"
                    sx={{
                      color: brand[500],
                      '&.Mui-checked': {
                        color: brand[700],
                      },
                      '&:hover': {
                        color: brand[600],
                      },
                    }}
                  />}
                  label={<Typography variant="caption">{t.upload.fileOptional}</Typography>}
                />
                <FormControlLabel
                  value="url"
                  control={<Radio
                    size="small"
                    sx={{
                      color: brand[500],
                      '&.Mui-checked': {
                        color: brand[700],
                      },
                      '&:hover': {
                        color: brand[600],
                      },
                    }}
                  />}
                  label={<Typography variant="caption">URL</Typography>}
                />
              </RadioGroup>

              {currentInputType === 'file' ? (
                <FileUpload
                  label={t.upload.fileOptional}
                  value={currentFileUrl}
                  onChange={(fileUrl) => handleFileChange(index, fileUrl)}
                  onFileChange={(file, oldKey) => handleItemFileChange(index, file, oldKey)}
                  showDownload={false}
                />
              ) : (
                <TextField
                  fullWidth
                  value={currentFileUrl || ''}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder={t.upload.enterUrl}
                  size="small"
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              )}
            </Box>
          );
        })}
        <IconButton
          onClick={handleAdd}
          sx={{ alignSelf: 'flex-start', color: brand[700], '&:hover': { color: brand[900] } }}
        >
          <AddIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default DynamicItemsInput;
