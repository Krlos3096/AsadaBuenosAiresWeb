import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  SxProps,
  Theme,
  Zoom,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandIcon from '@mui/icons-material/Expand';
import CompressIcon from '@mui/icons-material/Compress';
import { TransitionProps } from '@mui/material/transitions';
import { iconMap } from '../GenericCard/GenericCard';
import { getImageUrl } from '../../services/dataService';

export interface FullScreenDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  image?: string;
  icon?: string;
}

const FullScreenDialog: React.FC<FullScreenDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'lg',
  fullWidth = true,
  sx,
  image,
  icon
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Reset expanded state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setIsImageExpanded(false);
    }
  }, [open]);

  const Transition = React.forwardRef<
    unknown,
    TransitionProps & { children: React.ReactElement }
  >(function Transition(props, ref) {
    return <Zoom ref={ref} {...props} />;
  });

  const handleImageClick = () => {
    if (!isMd) {
      // Mobile: expand/collapse
      setIsImageExpanded(!isImageExpanded);
    }
  };

  const handleExpandToggle = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={isXs}
      slots={{ transition: Transition }}
      sx={sx}
      PaperProps={{
        sx: {
          display: 'flex',
          flexDirection: isMd ? 'row' : 'column',
          overflow: 'hidden',
          height: isMd ? '66dvh' : '100dvh',
        }
      }}
    >
      {image && (
        <Box
          sx={{
            width: isMd 
              ? (isImageExpanded ? '100%' : '50%') 
              : '100%',
            height: isXs
              ? (isImageExpanded ? '100dvh' : 'auto')
              : 'auto',
            position: 'relative',
            overflow: 'hidden',
            transition: 'width 0.6s ease-in-out, height 0.6s ease-in-out',
          }}
        >
          <Box
            component="img"
            src={getImageUrl(image) || ''}
            alt={title || 'Dialog header'}
            loading="lazy"
            decoding="async"
            onClick={handleImageClick}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: isXs && isImageExpanded ? 'contain' : 'fill',
              display: 'block',
              cursor: isXs ? 'pointer' : 'default',
            }}
          />
          {/* Expand control button (mobile only) */}
          {isXs && (
            <IconButton
              onClick={handleExpandToggle}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                },
                zIndex: 10,
              }}
            >
              {isImageExpanded ? <CompressIcon /> : <ExpandIcon />}
            </IconButton>
          )}
        </Box>
      )}
      <Box
        sx={{
          width: isMd && image && !isImageExpanded ? '50%' : '100%',
          display: isXs && isImageExpanded ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: isMd ? '66dvh' : 'auto',
        }}
      >
        {title && (
          <DialogTitle
            sx={{
              m: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1f7a1f',
              color: 'primary.contrastText',
              border: "1px solid black",
              borderRadius: 2,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <Box sx={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              {title}
              {icon && (!isXs || title.length <= 30) && (
                <Box sx={{ fontSize: '1.5rem' }}>
                  {iconMap[icon] || null}
                </Box>
              )}
            </Box>
            <IconButton
              edge="end"
              onClick={onClose}
              aria-label="close"
              sx={{ color: 'primary.contrastText', position: 'absolute', right: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
        )}
        {!title && (
          <IconButton
            edge="end"
            onClick={onClose}
            aria-label="close"
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
        <DialogContent
          sx={{
            p: 3,
            flex: 1,
            overflow: 'auto',
          }}
        >
          {children}
        </DialogContent>
        {actions && (
          <DialogActions
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            {actions}
          </DialogActions>
        )}
      </Box>
    </Dialog>
  );
};

export default FullScreenDialog;
