import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { brand } from '../../shared-theme/themePrimitives';

export interface FileUploadProps {
  value?: string;
  onChange: (key: string | undefined) => void;
  label?: string;
  error?: string;
  showDownload?: boolean;
  onFileChange?: (file: File | null, oldKey: string | undefined) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  label = 'File',
  error,
  showDownload = true,
  onFileChange
}) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [localFile, setLocalFile] = useState<File | null>(null);
  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:8787/images';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (accept both images and documents)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert(t.errors.invalidFileType);
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t.errors.fileTooLarge);
      return;
    }

    setLocalFile(file);
    onChange(undefined);
    onFileChange?.(file, value);

    // Reset input
    event.target.value = '';
  };

  const handleDelete = () => {
    if (!value && !localFile) return;

    setLocalFile(null);
    onChange(undefined);
    onFileChange?.(null, value);
  };

  const handleDownload = () => {
    if (!value) return;
    window.open(`${IMAGE_BASE_URL}/${value}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}: {t.upload.authRequired}
        </Typography>
        {value && showDownload && (
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mt: 1, color: brand[700], borderColor: brand[500], '&:hover': { borderColor: brand[700], backgroundColor: brand[50] } }}
            variant="outlined"
            size="small"
          >
            {t.upload.downloadFile}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      
      {value || localFile ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {localFile ? localFile.name : t.upload.fileUploaded}
          </Typography>
          {showDownload && value && (
            <IconButton onClick={handleDownload} size="small" aria-label={t.upload.downloadFile} sx={{ color: brand[700], '&:hover': { color: brand[900] } }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={handleDelete} size="small" aria-label={t.common.delete} sx={{ color: brand[700], '&:hover': { color: brand[900] } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ color: brand[700], borderColor: brand[500], '&:hover': { borderColor: brand[700], backgroundColor: brand[50] } }}
          fullWidth
        >
          {t.upload.uploadFile}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </Button>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1 }} role="alert">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
