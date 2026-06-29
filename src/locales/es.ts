export const es = {
  // Common
  common: {
    save: 'Guardar',
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    required: 'es requerido',
    yes: 'Sí',
    no: 'No',
  },

  // Authentication
  auth: {
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    username: 'Usuario',
    password: 'Contraseña',
    loginFailed: 'Error de inicio de sesión',
    loginSuccess: 'Inició sesión exitosamente',
    unauthorized: 'No autorizado',
    noToken: 'No se proporcionó token',
    invalidToken: 'Token inválido o expirado',
    userNotFound: 'Usuario no encontrado',
  },

  // Navigation
  nav: {
    home: 'Inicio',
    news: 'Noticias',
    governance: 'Gobernanza',
    services: 'Gestiones',
    contacts: 'Contactos',
    about: 'Nuestra Historia',
    data: 'Calidad de Agua',
  },

  // Cards
  cards: {
    title: 'Título',
    subtitle: 'Subtítulo',
    description: 'Descripción',
    image: 'Imagen',
    tag: 'Etiqueta',
    date: 'Fecha',
    year: 'Año',
    icon: 'Icono',
    url: 'Redirección a URL',
    googleMapsUrl: 'URL de Google Maps',
    items: 'Lista de Elementos',
    content: 'Contenido',
    number: 'Número',
    label: 'Etiqueta',
    value: 'Valor',
    mission: 'Misión',
    vision: 'Visión',
  },

  // Content Types
  contentType: {
    news: 'Noticia',
    service: 'Gestión',
    governance: 'Gobernanza',
    contact: 'Contacto',
    carousel: 'Diapositiva',
    timeline: 'Línea de tiempo',
    mission: 'Misión',
    vision: 'Visión',
  },

  // Actions
  actions: {
    addNews: 'Agregar Noticia',
    editNews: 'Editar Noticia',
    deleteNews: 'Eliminar Noticia',
    addService: 'Agregar Gestión',
    editService: 'Editar Gestión',
    deleteService: 'Eliminar Gestión',
    addGovernance: 'Agregar Gobernanza',
    editGovernance: 'Editar Gobernanza',
    deleteGovernance: 'Eliminar Gobernanza',
    addContact: 'Agregar Contacto',
    editContact: 'Editar Contacto',
    deleteContact: 'Eliminar Contacto',
    addSlide: 'Agregar Slide',
    editSlide: 'Editar Slide',
    deleteSlide: 'Eliminar Slide',
    addTimeline: 'Agregar a Línea de Tiempo',
    editTimeline: 'Editar de Línea de Tiempo',
    deleteTimeline: 'Eliminar de Línea de Tiempo',
  },

  // Confirmations
  confirm: {
    delete: '¿Estás seguro de eliminar este elemento?',
    deleteNews: '¿Estás seguro de eliminar esta noticia?',
    deleteService: '¿Estás seguro de eliminar este elemento?',
    deleteContact: '¿Estás seguro de eliminar este contacto?',
    deleteSlide: '¿Estás seguro de eliminar este slide?',
  },

  // Validation
  validation: {
    fieldRequired: '{{field}} es requerido',
    errorsInFields: '¡Hay errores en los campos, por favor revisar!',
    missingFields: 'Faltan campos requeridos',
  },

  // Empty States
  empty: {
    noNews: 'No hay noticias disponibles',
    noServices: 'No hay gestiones disponibles',
    noGovernance: 'No hay elementos de gobernanza disponibles',
    noContacts: 'No hay contactos disponibles',
  },

  // File Upload
  upload: {
    clickToUpload: 'Hacer clic para subir imagen',
    allowedTypes: 'JPEG, PNG, WebP (máx 10MB)',
    uploadFile: 'Subir archivo',
    fileOptional: 'Archivo (opcional)',
    enterUrl: 'Ingrese URL (ej. https://ejemplo.com/archivo.pdf)',
    fileUploaded: 'Archivo subido exitosamente',
    authRequired: 'Se requiere autenticación para subir archivos',
    downloadFile: 'Descargar archivo',
    clickToVisit: 'Hacer clic para visitar',
    clickToDownload: 'Hacer clic para descargar',
  },

  // Errors
  errors: {
    loadError: 'Error al cargar datos',
    deleteError: 'Error al eliminar',
    uploadError: 'Error al subir',
    deleteFile: 'Error al eliminar archivo',
    serveImage: 'Error al servir imagen',
    cardNotFound: 'Tarjeta no encontrada',
    slideNotFound: 'Diapositiva de inicio no encontrada',
    timelineNotFound: 'Elemento de línea de tiempo no encontrado',
    aboutNotFound: 'Contenido de "Nuestra Historia" no encontrado',
    imageNotFound: 'Imagen no encontrada',
    notFound: 'No encontrado',
    noFileProvided: 'No se proporcionó archivo',
    invalidFile: 'Archivo inválido proporcionado',
    invalidFileType: 'Tipo de archivo inválido. Tipos permitidos: JPEG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV',
    fileTooLarge: 'Archivo demasiado grande. Tamaño máximo es 10MB.',
    mustHaveOneSlide: 'Debe haber al menos un slide. No se puede eliminar el único slide.',
  },

  // Icons
  icons: {
    groups: 'Grupos',
    gavel: 'Martillo',
    receipt: 'Recibo',
    waterDrop: 'Gota de agua',
    phone: 'Teléfono',
    email: 'Correo',
    location: 'Ubicación',
  },

  // Orientation
  orientation: {
    rotateToPortrait: 'Por favor, gira tu dispositivo a modo vertical o maximiza la ventana',
    rotateToPortraitBestExperience: 'Por favor, gira tu dispositivo a modo vertical o maximiza la ventana para la mejor experiencia',
  },

  // PWA Installation
  pwa: {
    install: 'Instalar App',
    instructions: 'Para instalar la app en iOS:',
    step1: 'Toque el botón Compartir',
    step2: 'Desplácese hacia abajo y toque "Agregar al inicio"',
    step3: 'Toque "Agregar" para confirmar',
  },
};

export type Translations = typeof es;
