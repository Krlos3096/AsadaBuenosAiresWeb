import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppTheme from './shared-theme/AppTheme';
import {
  AppBar,
  Noticias,
  Gestiones,
  Gobernanza,
  NuestraHistoria,
  Datos,
  Contactos,
  Footer,
  ScrollToTop,
  LandscapeWarning
} from './components';
import GlobalDialog from './components/FullScreenDialog/GlobalDialog';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import './App.css';

function AppContent() {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Router>
        <AppRoutes />
      </Router>
    </AppTheme>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <>
      <LandscapeWarning />
      <ScrollToTop />
      <AppBar />
      <Box sx={{ minHeight: "calc(100dvh - 250px)", my: { xs: 22, md: 20 }, }}>
        <Routes>
          <Route path="/" element={<></>} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/gestiones" element={<Gestiones />} />
          <Route path="/gobernanza" element={<Gobernanza />} />
          <Route path="/nuestra-historia" element={<NuestraHistoria />} />
          <Route path="/datos" element={<Datos />} />
          <Route path="/contactos" element={<Contactos />} />
        </Routes>
      </Box>
      <Footer collapsed={!isHomePage} />
    </>
  );
}

export default function App() {
  return (
    <TranslationProvider>
      <AuthProvider>
        <GlobalDialog>
          <AppContent />
        </GlobalDialog>
      </AuthProvider>
    </TranslationProvider>
  );
}
