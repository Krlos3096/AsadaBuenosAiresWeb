import React from 'react';
import GenericCard, { GenericCardData } from './GenericCard';

// Example usage data for different variants

// News card example (like Noticias)
export const newsCardExample: GenericCardData = {
  id: '1',
  title: 'Nueva planta de tratamiento inaugurada',
  description: 'La ASADA Buenos Aires ha inaugurado una moderna planta de tratamiento que beneficiará a más de 500 familias en la comunidad.',
  image: '/path/to/news-image.jpg',
  tag: 'Infraestructura',
  authors: [
    { name: 'Juan Pérez', avatar: '/path/to/avatar1.jpg' },
    { name: 'María González', avatar: '/path/to/avatar2.jpg' }
  ],
  variant: 'news'
};

// Service card example (like Gestiones)
export const serviceCardExample: GenericCardData = {
  id: '2',
  title: 'Solicitud de Nuevo Servicio',
  description: 'Solicita una nueva conexión de agua potable para tu domicilio o negocio.',
  icon: 'WaterDrop',
  items: [
    'Copia de cédula de identidad',
    'Prueba de propiedad o contrato de arrendamiento',
    'Croquis de ubicación del predio'
  ],
  variant: 'service'
};

// Governance card example (like Gobernanza)
export const governanceCardExample: GenericCardData = {
  id: '3',
  title: 'Transparencia',
  description: 'Accede a toda la información sobre nuestra gestión financiera y administrativa.',
  icon: 'Assignment',
  items: [
    'Balance Anual',
    'Informe de Auditoría',
    'Presupuesto Anual',
    'Estado de Cuentas'
  ],
  variant: 'governance'
};

// Contact card example (like Contactos)
export const contactCardExample: GenericCardData = {
  id: '4',
  title: '2763 6703',
  description: 'Llámanos para cualquier consulta o emergencia.',
  icon: 'Phone',
  variant: 'contact'
};

// Example component showing all variants
export const GenericCardExamples: React.FC = () => {
  const [focusedCard, setFocusedCard] = React.useState<number | null>(null);

  const handleFocus = (index: number) => {
    setFocusedCard(index);
  };

  const handleBlur = () => {
    setFocusedCard(null);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>GenericCard Examples</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>News Variant</h3>
        <GenericCard
          data={newsCardExample}
          focused={focusedCard === 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Service Variant</h3>
        <GenericCard
          data={serviceCardExample}
          focused={focusedCard === 2}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Governance Variant</h3>
        <GenericCard
          data={governanceCardExample}
          focused={focusedCard === 3}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Contact Variant</h3>
        <GenericCard
          data={contactCardExample}
          focused={focusedCard === 4}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
        />
      </div>
    </div>
  );
};

export default GenericCardExamples;
