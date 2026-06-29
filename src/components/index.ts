// Main components barrel export
export { default as AppBar } from './AppBar/AppBar';
export { default as Footer } from './Footer/Footer';
export { default as Latest } from './Latest/Latest';
export { default as Home } from './Home/Home';
export { default as ContactsContainer } from './ContactsContainer/ContactsContainer';
export { default as ContactFloat } from './ContactFloat/ContactFloat';
export { default as ScrollToTop } from './ScrollToTop/ScrollToTop';
export { default as GenericCard } from './GenericCard/GenericCard';
export { default as Search } from './Search/Search';
export { default as ImageCarousel } from './ImageCarousel/ImageCarousel';
export { default as FullScreenDialog } from './FullScreenDialog/FullScreenDialog';
export { default as GlobalDialog } from './FullScreenDialog/GlobalDialog';
export { default as Loading } from './Loading/Loading';
export { default as ImageUpload } from './ImageUpload/ImageUpload';
export { default as FileUpload } from './FileUpload/FileUpload';
export { default as DynamicItemsInput } from './DynamicItemsInput/DynamicItemsInput';
export { default as LandscapeWarning } from './LandscapeWarning/LandscapeWarning';
export { useDialog, DialogProvider } from '../context/DialogContext';

// Section components for routing
export { default as Noticias } from './Noticias/Noticias';
export { default as Gestiones } from './Gestiones/Gestiones';
export { default as Gobernanza } from './Gobernanza/Gobernanza';
export { default as NuestraHistoria } from './NuestraHistoria/NuestraHistoria';
export { default as CalidadDeAgua } from './Datos/CalidadDeAgua';
export { default as Contactos } from './Contactos/Contactos';

// Re-export types if needed
export type { default as AppBarProps } from './AppBar/AppBar';
export type { default as FooterProps } from './Footer/Footer';
export type { default as LatestProps } from './Latest/Latest';
export type { default as HomeProps } from './Home/Home';
export type { default as ContactsContainerProps } from './ContactsContainer/ContactsContainer';
export type { default as ContactFloatProps } from './ContactFloat/ContactFloat';
