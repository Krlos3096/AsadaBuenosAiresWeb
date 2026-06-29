import * as React from 'react';
import { alpha, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { ReactComponent as LogoAsada } from '../../assets/asada-buenosaires-logo.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageCarousel from '../ImageCarousel/ImageCarousel';
import { DataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useTranslation } from '../../context/TranslationContext';
import { LoginDialogContent } from '../LoginDialog';
import AddEditDialogContent from '../AddEditDialog/AddEditDialogContent';
import './AppBar.scss';
import { KeyboardArrowUp, Menu, CloseRounded, Download, IosShare } from '@mui/icons-material';
import Wave from 'react-wavify';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  backdropFilter: 'blur(24px)',
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
}));

export default function AppBarComponent() {
  const [open, setOpen] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { openDialog, closeDialog } = useDialog();
  const { t } = useTranslation();
  const [carouselImages, setCarouselImages] = React.useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if app is already installed
  React.useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isInStandaloneMode);
  }, []);

  // Detect iOS
  React.useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  // Handle PWA install prompt
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      // Show iOS installation instructions
      openDialog({
        title: t.pwa.install,
        content: (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ mb: 2 }}>
              {t.pwa.instructions}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              1. {t.pwa.step1} <IosShare sx={{ verticalAlign: 'middle', fontSize: '1rem' }} />
            </Typography>
            <Typography sx={{ mb: 1 }}>
              2. {t.pwa.step2}
            </Typography>
            <Typography>
              3. {t.pwa.step3}
            </Typography>
          </Box>
        ),
        maxWidth: 'sm',
      });
    } else if (deferredPrompt) {
      // Trigger Android PWA install
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      });
    }
  };

  const toggleDrawer = (newOpen: boolean) => () => {
    if (!isCarouselCollapsed) {
      handleNavigation("/noticias");
      return;
    }
    setOpen(newOpen);
  };

  const handleLoginClick = () => {
    openDialog({
      title: 'Portal Administrativo',
      content: <LoginDialogContent onSuccess={closeDialog} />,
      maxWidth: 'sm',
    });
  };

  const handleLogoutClick = () => {
    logout();
  };

  // Determine if carousel should be collapsed (not on base path)
  const isCarouselCollapsed = location.pathname !== '/' && location.pathname !== '';

  React.useEffect(() => {
    async function loadCarouselImages() {
      try {
        const images = await DataService.getCarouselImages();
        setCarouselImages(images);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos';
        alert(errorMessage);
      }
    }
    loadCarouselImages();
  }, []);

  const handleDeleteSlide = async (index: number, slide: any) => {
    if (carouselImages.length === 1) {
      alert(t.errors.mustHaveOneSlide);
      return;
    }
    
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(t.confirm.deleteSlide)) return;
    
    try {
      await DataService.deleteHomeSlide(String(slide.id));
      const updatedImages = await DataService.getCarouselImages();
      setCarouselImages(updatedImages);
    } catch (error) {
      alert(t.errors.deleteError + ': ' + (error as Error).message);
    }
  };

  const handleEditSlide = (index: number, slide: any) => {
    openDialog({
      title: t.actions.editSlide,
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              const slideId = slide.id;
              await DataService.updateHomeSlide(String(slideId), data);
              const updatedImages = await DataService.getCarouselImages();
              setCarouselImages(updatedImages);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="carousel"
          initialData={slide}
          mode="edit"
        />
      ),
      maxWidth: 'md',
      fullWidth: true
    });
  };

  const handleAddSlide = () => {
    openDialog({
      title: t.actions.addSlide,
      icon: 'Add',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.createHomeSlide(data);
              const updatedImages = await DataService.getCarouselImages();
              setCarouselImages(updatedImages);
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="carousel"
          mode="add"
        />
      ),
      maxWidth: 'md',
      fullWidth: true
    });
  };

  const handleNavigation = (path: string) => {
    if (path === '/consulta-en-linea') {
      // Open external portal in new tab
      window.open('https://www.cisaweb.com/mclientes/', '_blank', 'noopener,noreferrer');
    } else {
      // Normal navigation for other routes
      navigate(path);
    }
    setOpen(false);
  };

  const isActive = (path: string) => {
    // ConsultaEnLinea opens in new tab, so it's never "active" in the app
    if (path === '/consulta-en-linea') {
      return false;
    }
    return location.pathname === path;
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px))",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      role="banner"
    >
      {/* Hero Section with Background Image */}
      <ImageCarousel
        images={carouselImages}
        autoPlay={true}
        interval={4000}
        collapsed={isCarouselCollapsed}
        showEditControls={isAuthenticated}
        currentPath={location.pathname}
        onEdit={handleEditSlide}
        onDelete={handleDeleteSlide}
        onAdd={handleAddSlide}
        sx={{
          position: "relative",
          zIndex: 0,
        }}
      />
      <Container
        maxWidth={false}
        disableGutters
        sx={{ position: "relative", width: "100%", px: 0 }}
      >
        <StyledToolbar
          variant="dense"
          disableGutters
          sx={{ bgcolor: "#52bc52", position: "relative", zIndex: 1 }}
        >
          <Wave
            paused={true}
            fill="url(#gradient-behind)"
            options={{
              amplitude: 40,
              speed: 6,
              points: 7,
            }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              zIndex: 0,
              pointerEvents: "none",
              height: "125px",
            }}
          >
            <defs>
              <linearGradient
                id="gradient-behind"
                gradientTransform="rotate(90)"
              >
                <stop offset="5%" stopColor="#52bc52" />
                <stop offset="95%" stopColor="#042f04" />
              </linearGradient>
            </defs>
          </Wave>
          <Wave
            paused={true}
            fill="url(#gradient)"
            options={{
              amplitude: 40,
              speed: 1,
              points: 3,
            }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              zIndex: 0,
              pointerEvents: "none",
              height: "125px",
            }}
          >
            <defs>
              <linearGradient id="gradient" gradientTransform="rotate(90)">
                <stop offset="10%" stopColor="#52bc52" />
                <stop offset="90%" stopColor="#042f04" />
              </linearGradient>
            </defs>
          </Wave>
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}
          >
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              <Box
                component={LogoAsada}
                sx={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%) translateY(-25%)",
                  width: "8%",
                  objectFit: "contain",
                }}
              />
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => handleNavigation("/")}
                sx={{
                  backgroundColor: isActive("/")
                    ? "primary.dark"
                    : "transparent",
                  color: isActive("/") ? "primary.contrastText" : "inherit",
                }}
              >
                {t.nav.home}
              </Button>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => handleNavigation("/noticias")}
                sx={{
                  backgroundColor: isActive("/noticias")
                    ? "primary.dark"
                    : "transparent",
                  color: isActive("/noticias")
                    ? "primary.contrastText"
                    : "inherit",
                }}
              >
                {t.nav.news}
              </Button>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => handleNavigation("/gestiones")}
                sx={{
                  backgroundColor: isActive("/gestiones")
                    ? "primary.dark"
                    : "transparent",
                  color: isActive("/gestiones")
                    ? "primary.contrastText"
                    : "inherit",
                }}
              >
                {t.nav.services}
              </Button>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => handleNavigation("/gobernanza")}
                sx={{
                  backgroundColor: isActive("/gobernanza")
                    ? "primary.dark"
                    : "transparent",
                  color: isActive("/gobernanza")
                    ? "primary.contrastText"
                    : "inherit",
                }}
              >
                {t.nav.governance}
              </Button>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => handleNavigation("/calidad-de-agua")}
                sx={{
                  backgroundColor: isActive("/calidad-de-agua")
                    ? "primary.dark"
                    : "transparent",
                  color: isActive("/calidad-de-agua")
                    ? "primary.contrastText"
                    : "inherit",
                }}
              >
                Calidad de Agua
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => handleNavigation("/nuestra-historia")}
              sx={{
                backgroundColor: isActive("/nuestra-historia")
                  ? "primary.dark"
                  : "transparent",
                color: isActive("/nuestra-historia")
                  ? "primary.contrastText"
                  : "inherit",
              }}
            >
              {t.nav.about}
            </Button>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => handleNavigation("/contactos")}
              sx={{
                backgroundColor: isActive("/contactos")
                  ? "primary.dark"
                  : "transparent",
                color: isActive("/contactos")
                  ? "primary.contrastText"
                  : "inherit",
              }}
            >
              {t.nav.contacts}
            </Button>
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={isAuthenticated ? handleLogoutClick : handleLoginClick}
            >
              {isAuthenticated
                ? `${t.auth.logout} (${user?.username})`
                : "Portal Administrativo"}
            </Button>
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            {!isInstalled && (deferredPrompt || isIOS) && (
              <IconButton
                aria-label="Install app"
                onClick={handleInstallClick}
                sx={{
                  border: "1px solid black",
                  position: "absolute",
                  left: "1rem",
                }}
              >
                <Download />
              </IconButton>
            )}
            <Box
              component={LogoAsada}
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%) translateY(-25%)",
                width: "20%",
                objectFit: "contain",
              }}
            />
            <IconButton
              aria-label="Menu button"
              onClick={toggleDrawer(!open)}
              sx={{ border: "1px solid black" }}
            >
              {!isCarouselCollapsed ? (
                <KeyboardArrowUp />
              ) : open ? (
                <CloseRounded />
              ) : (
                <Menu />
              )}
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              slotProps={{
                paper: {
                  sx: {
                    top: "var(--template-frame-height, 100px)",
                    marginLeft: "5%",
                    marginRight: "8%",
                    border: "1px solid black",
                    borderRadius: "8px",
                    paddingTop: "50px",
                  },
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: "background.default" }}>
                <MenuItem onClick={() => handleNavigation("/")}>
                  {t.nav.home}
                </MenuItem>
                <MenuItem onClick={() => handleNavigation("/noticias")}>
                  {t.nav.news}
                </MenuItem>
                <MenuItem onClick={() => handleNavigation("/gestiones")}>
                  {t.nav.services}
                </MenuItem>
                <MenuItem onClick={() => handleNavigation("/gobernanza")}>
                  {t.nav.governance}
                </MenuItem>
                <MenuItem onClick={() => handleNavigation("/calidad-de-agua")}>
                  Calidad de Agua
                </MenuItem>
                <MenuItem onClick={() => handleNavigation("/nuestra-historia")}>
                  {t.nav.about}
                </MenuItem>
                <MenuItem onClick={() => handleNavigation("/contactos")}>
                  {t.nav.contacts}
                </MenuItem>
                <Divider sx={{ my: 3 }} />
                <MenuItem>
                  <Button
                    color="secondary"
                    variant="contained"
                    fullWidth
                    onClick={
                      isAuthenticated ? handleLogoutClick : handleLoginClick
                    }
                  >
                    {isAuthenticated
                      ? `${t.auth.logout} (${user?.username})`
                      : "Portal Administrativo"}
                  </Button>
                </MenuItem>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
