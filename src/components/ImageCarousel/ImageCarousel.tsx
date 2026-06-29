import * as React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Box, BoxProps, Typography, IconButton } from '@mui/material';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { memo } from 'react';
import { getImageUrl } from '../../services/dataService';

export interface CarouselSlideData {
  image: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export interface ImageCarouselProps {
  images: string[] | CarouselSlideData[];
  autoPlay?: boolean;
  interval?: number;
  sx?: BoxProps['sx'];
  collapsed?: boolean;
  showEditControls?: boolean;
  onEdit?: (index: number, slide: CarouselSlideData) => void;
  onDelete?: (index: number, slide: CarouselSlideData) => void;
  onAdd?: () => void;
  currentPath?: string;
}

const defaultSx = {
  height: { xs: '75dvh', md: '80dvh' },
};

const collapsedSx = {
  height: '100px',
};

const swiperStyle = {
  width: '100%',
  height: '80dvh',
};

function ImageCarousel({ images, autoPlay = true, interval = 4000, sx, collapsed = false, showEditControls = false, onEdit, onDelete, onAdd, currentPath }: ImageCarouselProps) {
  if (images.length === 0) {
    return (
      <Box sx={{ backgroundColor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx }}>
        No images available
      </Box>
    );
  }

  // Normalize images to CarouselSlideData format
  const normalizedSlides: CarouselSlideData[] = images.map((item) => {
    if (typeof item === 'string') {
      return { image: item };
    }
    return item;
  });

  // Only show edit controls when authenticated and on root path
  const shouldShowEditControls = showEditControls && currentPath === '/';

  const baseSx = collapsed ? collapsedSx : defaultSx;
  const mergedSx = {
    ...baseSx,
    ...sx,
    width: '100%',
    transition: 'height 0.6s ease-in-out',
    overflow: 'hidden', // Prevent content overflow during transition
  };

  return (
    <Box sx={mergedSx}>
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={autoPlay && !collapsed ? {
          delay: interval,
          disableOnInteraction: false,
        } : false}
        navigation
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        style={swiperStyle}
        loop={normalizedSlides.length > 1}
      >
        {normalizedSlides.map((slide, index) => {
          return (
          <SwiperSlide key={index}>
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Edit/Add/Delete Controls */}
              {shouldShowEditControls && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    display: 'flex',
                    gap: 1,
                    zIndex: 10,
                  }}
                >
                  <IconButton
                    onClick={() => onAdd?.()}
                    sx={{ backgroundColor: 'success.main', color: 'success.contrastText' }}
                    aria-label="Agregar slide"
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onEdit?.(index, slide)}
                    sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
                    aria-label="Editar slide"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete?.(index, slide)}
                    sx={{ backgroundColor: 'error.main', color: 'error.contrastText' }}
                    aria-label="Eliminar slide"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
              {/* Fixed image container to prevent resizing */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={getImageUrl(slide.image) || ''}
                  alt={slide.title || `Slide ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backfaceVisibility: 'hidden', // Prevent flickering
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                />
              </Box>
              {/* Text Overlay - Hidden when collapsed */}
              {!collapsed && (slide.title || slide.subtitle || slide.description) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    paddingTop: '25%',
                    textAlign: 'center',
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 2,
                  }}
                >
                  {slide.title && (
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: { xs: '1.5rem', md: '2.5rem' },
                      }}
                    >
                      {slide.title}
                    </Typography>
                  )}
                  {slide.subtitle && (
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        fontSize: { xs: '1rem', md: '1.25rem' },
                        opacity: 0.9,
                      }}
                    >
                      {slide.subtitle}
                    </Typography>
                  )}
                  {slide.description && (
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        opacity: 0.8,
                        lineHeight: 1.4,
                      }}
                    >
                      {slide.description}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
}

export default memo(ImageCarousel);
