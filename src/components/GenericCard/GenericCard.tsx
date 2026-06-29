import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from '../../context/TranslationContext';
import { useDialog } from '../index';
import { memo, useCallback } from 'react';
import { getImageUrl } from '../../services/dataService';
import './GenericCard.scss';

// Helper function to get text from pipe-delimited string
function getItemText(item: string): string {
  return item.split('|')[0];
}

// Helper function to get file URL from pipe-delimited string
function getItemFileUrl(item: string): string | undefined {
  const parts = item.split('|');
  return parts.length > 1 ? parts[1] : undefined;
}

// Helper function to check if URL is external
function isExternalUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// Helper function to extract all R2 file URLs from card data
function extractFileUrls(data: any): string[] {
  const fileUrls: string[] = [];
  
  // Extract image URL
  if (data.image && !isExternalUrl(data.image)) {
    fileUrls.push(data.image);
  }
  
  // Extract file URLs from items (pipe-delimited format)
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: string) => {
      const parts = item.split('|');
      if (parts.length > 1) {
        const fileUrl = parts[1];
        if (fileUrl && !isExternalUrl(fileUrl)) {
          fileUrls.push(fileUrl);
        }
      }
    });
  }
  
  return fileUrls;
}

// Helper function to delete files from R2
async function deleteFilesFromR2(fileUrls: string[]): Promise<void> {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';
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
}

// Helper function to get file extension from file URL
function getFileExtension(fileUrl: string): string {
  const parts = fileUrl.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

// Helper function to download file with custom filename
async function downloadFile(fileUrl: string, filename: string): Promise<void> {
  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:8787/images';
  const extension = getFileExtension(fileUrl);
  const fullUrl = `${IMAGE_BASE_URL}/${fileUrl}`;
  
  try {
    const response = await fetch(fullUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error al descargar:', error);
    // Fallback to opening in new tab
    window.open(fullUrl, '_blank');
  }
}

// Helper function to format date in user-friendly format
function formatDate(dateString: string): string {
  try {
    // Parse DD/MM/YYYY format
    const parts = dateString.includes('-') ? dateString.split('-') : dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
      const year = parseInt(parts[0], 10);
      const date = new Date(year, month, day);
      
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    
    // Fallback to standard Date parsing
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Types for different card variants
export interface GenericCardData {
  id: string;
  title: string;
  description?: string;
  date?: string;
  image?: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  authors?: { name: string; avatar: string }[];
  icon?: string;
  items?: string[];
  url?: string;
  googleMapsUrl?: string;
  variant?: 'default' | 'news' | 'service' | 'governance' | 'contact';
}

export interface GenericCardProps {
  data: GenericCardData;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onFocus?: (index: number) => void;
  onBlur?: () => void;
  tabIndex?: number;
  focused?: boolean;
  className?: string;
  hideImage?: boolean;
  customContent?: React.ReactNode;
  showEditControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Styled components based on Noticias structure
const StyledCard = styled(Card)<{ cardvariant?: string }>(({ theme, cardvariant = 'default' }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  height: '100%',
  backgroundColor: (theme.vars || theme).palette.background.default,
  transition: cardvariant === 'service' || cardvariant === 'governance' 
    ? 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
    : 'none',
  '&:hover': {
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transform: cardvariant === 'service' || cardvariant === 'governance' ? 'translateY(-4px)' : 'none',
    boxShadow: cardvariant === 'service' || cardvariant === 'governance' ? 4 : 'none',
  },
  '&:focus-visible': {
    outline: '3px solid',
    outlineColor: 'hsla(210, 98%, 48%, 0.5)',
    outlineOffset: '2px',
  },
  textAlign: 'center',
  border: '1px solid rgba(0, 0, 0, 0.08)',
}));

const StyledCardContent = styled(CardContent)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 16,
  flexGrow: 1,
  '&:last-child': {
    paddingBottom: 16,
  },
});

const StyledTypography = styled(Typography)({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

// Author component (from Noticias)
const Author: React.FC<{ authors: { name: string; avatar: string }[] }> = ({ authors }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
        {authors.slice(0, 3).map((author, index) => (
          <Avatar
            key={index}
            alt={author.name}
            src={author.avatar}
            sx={{ width: 24, height: 24 }}
          />
        ))}
        {authors.length > 3 && (
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
            +{authors.length - 3}
          </Avatar>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {authors.length} {authors.length === 1 ? 'autor' : 'autores'}
      </Typography>
    </Box>
  );
};


// Icon component for service/governance cards
const CardIcon: React.FC<{ icon?: string; variant?: string }> = ({ icon, variant }) => {
  if (!icon || !['service', 'governance', 'contact'].includes(variant || '')) {
    return null;
  }

  const iconNode = iconMap[icon];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 2,
        color: 'primary.main',
        fontSize: variant === 'contact' ? '48px' : '32px',
      }}
    >
      {iconNode}
    </Box>
  );
};

// Icon mapping for string-based icon names
export const iconMap: { [key: string]: React.ReactNode } = {
  Groups: <GroupsIcon />,
  Gavel: <GavelIcon />,
  AccountBalance: <AccountBalanceIcon />,
  Description: <DescriptionIcon />,
  Assignment: <AssignmentIcon />,
  Payment: <PaymentIcon />,
  Receipt: <ReceiptIcon />,
  WaterDrop: <WaterDropIcon />,
  Phone: <PhoneIcon />,
  Email: <EmailIcon />,
  LocationOn: <LocationOnIcon />
};

const GenericCard: React.FC<GenericCardProps> = ({
  data,
  size = 'medium',
  onClick,
  onFocus,
  onBlur,
  tabIndex,
  focused,
  className,
  hideImage = false,
  customContent,
  showEditControls = false,
  onEdit,
  onDelete,
}) => {
  const { openDialog } = useDialog();
  const { t } = useTranslation();
  const variant = data.variant || 'default';

  const handleFocus = useCallback(() => {
    onFocus?.(parseInt(data.id));
  }, [onFocus, data.id]);

  const getDialogContent = useCallback(() => {
    switch (variant) {
      case 'news':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {data.tag && (
                <Chip label={data.tag} size="small" variant="outlined" />
              )}
              {data.authors && data.authors.map((author, idx) => (
                <Chip key={idx} label={author.name} size="small" variant="outlined" />
              ))}
            </Box>
            <Box sx={{ typography: 'body1', lineHeight: 1.8 }}>
              {data.description}
            </Box>
          </Box>
        );
      case 'service':
      case 'governance':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {data.subtitle && (
              <Typography variant="h6" color="text.secondary">
                {data.subtitle}
              </Typography>
            )}
            {data.description && (
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {data.description}
              </Typography>
            )}
            {data.items && (
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: "grey.50" }}>
                <List dense>
                  {(() => {
                    const textOnlyItems = data.items.filter((item: string) => !item.includes('|'));
                    const textWithFileItems = data.items.filter((item: string) => item.includes('|'));
                    const allItems = [...textOnlyItems, ...textWithFileItems];
                    return allItems.map((req: string, reqIndex: number) => {
                      const text = getItemText(req);
                      const fileUrl = getItemFileUrl(req);
                      return (
                        <ListItem 
                          key={reqIndex} 
                          sx={{ 
                            px: 0, 
                            py: 0.5,
                            cursor: fileUrl ? 'pointer' : 'default',
                            '&:hover': fileUrl ? {
                              backgroundColor: 'action.hover',
                            } : {},
                          }}
                          onClick={() => {
                            if (fileUrl) {
                              if (isExternalUrl(fileUrl)) {
                                // Open external URL in new tab
                                window.open(fileUrl, '_blank');
                              } else {
                                // Download file from R2
                                downloadFile(fileUrl, text);
                              }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: "primary.main",
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={text} 
                            primaryTypographyProps={{ 
                              variant: "body2",
                              sx: fileUrl ? {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              } : {},
                            }}
                            secondary={fileUrl && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                {isExternalUrl(fileUrl) ? (
                                  <OpenInNewIcon fontSize="small" sx={{ fontSize: 16 }} />
                                ) : (
                                  <DownloadIcon fontSize="small" sx={{ fontSize: 16 }} />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {isExternalUrl(fileUrl) ? t.upload.clickToVisit : t.upload.clickToDownload}
                                </Typography>
                              </Box>
                            )}
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                      );
                    });
                  })()}
                </List>
              </Paper>
            )}
          </Box>
        );
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {data.subtitle && (
              <Typography variant="h6" color="text.secondary">
                {data.subtitle}
              </Typography>
            )}
            {data.description && (
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {data.description}
              </Typography>
            )}
          </Box>
        );
    }
  }, [variant, data.tag, data.authors, data.subtitle, data.description, data.items, t]);

  const handleCardClick = useCallback(() => {
    // If googleMapsUrl exists, do nothing on click
    if (data.googleMapsUrl) {
      return;
    }

    // If icon is Phone, trigger phone call
    if (data.icon === 'Phone') {
      window.open(`tel:+506${data.title.replace(/\s/g, '')}`, '_self');
      return;
    }

    // If icon is Email, trigger email
    if (data.icon === 'Email') {
      window.open(`mailto:${data.title}`, '_self');
      return;
    }

    if (onClick) {
      onClick();
      return;
    }

    if (data.url) {
      window.open(data.url, '_blank');
      return;
    }

    openDialog({
      title: data.title,
      image: data.image,
      icon: data.icon,
      content: getDialogContent(),
      maxWidth: 'lg',
      fullWidth: true
    });
  }, [data, onClick, openDialog, getDialogContent]);

  const getImageHeight = useCallback(() => {
    switch (size) {
      case 'small': return 120;
      case 'large': return 240;
      default: return 180;
    }
  }, [size]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  }, [onEdit]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Delete files from R2 before removing the card
    const fileUrls = extractFileUrls(data);
    if (fileUrls.length > 0) {
      await deleteFilesFromR2(fileUrls);
    }
    
    onDelete?.();
  }, [data, onDelete]);

  return (
    <Box sx={{ position: 'relative' }}>
      <StyledCard
        cardvariant={variant}
        className={`${className || ''} ${focused ? 'Mui-focused' : ''}`}
        onClick={handleCardClick}
        onFocus={handleFocus}
        onBlur={onBlur}
        tabIndex={tabIndex}
      >
        {/* Card Media/Image */}
        {data.image && !hideImage && (variant === 'news' || variant === 'governance') && (
        <CardMedia
          component="img"
          alt={data.title}
          image={getImageUrl(data.image) || ''}
          loading="lazy"
          decoding="async"
          sx={{
            aspectRatio: "16 / 9",
            borderBottom: "1px solid",
            borderColor: "divider",
            height: getImageHeight(),
          }}
        />
      )}

      {/* Google Maps */}
      {data.googleMapsUrl && (
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "grey.50",
          }}
        >
          <iframe
            src={data.googleMapsUrl}
            style={{
              width: "100%",
              height: "200px",
              border: "none",
            }}
            title="Map"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Box>
      )}

      <StyledCardContent>
        {/* Icon for service/governance/contact variants */}
        <CardIcon icon={data.icon} variant={variant} />

        {/* Badge/Tag */}
        {(data.tag || data.badge) && (
          <Typography gutterBottom variant="caption" component="div">
            {data.tag || data.badge}
          </Typography>
        )}

        {/* Subtitle */}
        {data.subtitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {data.subtitle}
          </Typography>
        )}

        {/* Title */}
        <Typography 
          gutterBottom 
          variant={size === 'small' ? 'h6' : 'h5'} 
          component="h3"
          sx={{ fontWeight: 'bold' }}
        >
          {data.title}
        </Typography>

        {/* Description */}
        {variant !== 'news' && data.description && (
          <StyledTypography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {data.description}
          </StyledTypography>
        )}

        {/* Date */}
        {data.date && (
          <StyledTypography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {formatDate(data.date)}
          </StyledTypography>
        )}

        {/* Custom Content */}
        {customContent}

        {/* Authors (only for news variant) */}
        {variant === 'news' && data.authors && data.authors.length > 0 && (
          <Author authors={data.authors} />
        )}
      </StyledCardContent>
    </StyledCard>
    {/* Edit/Delete Controls */}
    {showEditControls && (
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 50,
          display: 'flex',
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          p: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={handleEdit}
          sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
          aria-label={t.common.edit}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{ backgroundColor: 'error.main', color: 'error.contrastText' }}
          aria-label={t.common.delete}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    )}
    </Box>
  );
};

export default memo(GenericCard);
