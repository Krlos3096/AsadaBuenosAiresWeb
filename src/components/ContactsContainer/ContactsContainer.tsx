import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import FeedBackIcon from '@mui/icons-material/Feedback';
import ContactFloat from '../ContactFloat/ContactFloat';
import './ContactsContainer.scss';
import { useLocation } from 'react-router-dom';
import { DataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import AddEditDialogContent from '../AddEditDialog/AddEditDialogContent';
import ComplaintForm from '../ComplaintForm/ComplaintForm';

const ContactsContainer: React.FC = () => {
  const [whatsappPhoneInfo, setWhatsappPhoneInfo] = useState<string>('');
  const [whatsappPhoneSupport, setWhatsappPhoneSupport] = useState<string>('');
  const [facebookUrl, setFacebookUrl] = useState<string>('');
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { openDialog, closeDialog } = useDialog();

  const loadContacts = async () => {
    try {
      const [info, support, fb] = await Promise.all([
        DataService.getWhatsAppPhoneInfo(),
        DataService.getWhatsAppPhoneSupport(),
        DataService.getFacebookUrl()
      ]);
      setWhatsappPhoneInfo(info || '');
      setWhatsappPhoneSupport(support || '');
      setFacebookUrl(fb || '');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos';
      alert(errorMessage);
    }
  };

  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleWhatsAppSupportClick = () => {
    if (isAuthenticated) {
      handleEditWhatsAppSupport();
    } else {
      if (isEmail(whatsappPhoneSupport)) {
        openDialog({
          title: 'Enviar Queja',
          icon: 'Email',
          content: (
            <ComplaintForm
              to={whatsappPhoneSupport}
              onSuccess={() => {
                closeDialog();
                alert('Queja enviada exitosamente');
              }}
              onCancel={() => closeDialog()}
            />
          ),
          maxWidth: 'sm',
          fullWidth: true
        });
      }
      // If it's a phone number, let the default link behavior work (opens WhatsApp)
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleEditWhatsAppInfo = () => {
    if (!isAuthenticated) return;
    
    openDialog({
      title: 'Editar WhatsApp Gestiones',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.updateContacts({
                whatsapp_phone_info: data.value,
                whatsapp_phone_support: whatsappPhoneSupport,
                facebook_url: facebookUrl
              });
              await loadContacts();
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="contactFloat"
          initialData={{ value: whatsappPhoneInfo }}
          mode="edit"
        />
      ),
      maxWidth: 'sm',
      fullWidth: true
    });
  };

  const handleEditWhatsAppSupport = () => {
    if (!isAuthenticated) return;
    
    openDialog({
      title: 'Editar Contacto de Quejas/Averías',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.updateContacts({
                whatsapp_phone_info: whatsappPhoneInfo,
                whatsapp_phone_support: data.value,
                facebook_url: facebookUrl
              });
              await loadContacts();
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="contactFloat"
          initialData={{ value: whatsappPhoneSupport }}
          mode="edit"
        />
      ),
      maxWidth: 'sm',
      fullWidth: true
    });
  };

  const handleEditFacebook = () => {
    if (!isAuthenticated) return;
    
    openDialog({
      title: 'Editar Facebook',
      icon: 'Edit',
      content: (
        <AddEditDialogContent
          onSave={async (data) => {
            try {
              await DataService.updateContacts({
                whatsapp_phone_info: whatsappPhoneInfo,
                whatsapp_phone_support: whatsappPhoneSupport,
                facebook_url: data.value
              });
              await loadContacts();
              closeDialog();
            } catch (error) {
              throw error;
            }
          }}
          contentType="contactFloat"
          initialData={{ value: facebookUrl }}
          mode="edit"
        />
      ),
      maxWidth: 'sm',
      fullWidth: true
    });
  };

  return (
    <Box
      sx={{
        display: {
          xs: "block",
          md: location.pathname === "/" ? "none" : "block",
        },
      }}
      className="contacts-container"
    >
      <Box className="contacts-wrapper">
        {whatsappPhoneInfo && (
          <ContactFloat
            icon={<WhatsAppIcon />}
            link={`https://wa.me/${whatsappPhoneInfo.replace(/[^\d]/g, "")}`}
            tooltipTitle="WhatsApp Gestiones"
            ariaLabel="WhatsApp Gestiones"
            onClick={isAuthenticated ? handleEditWhatsAppInfo : undefined}
          />
        )}
        {whatsappPhoneSupport && (
          <ContactFloat
            icon={<FeedBackIcon />}
            link={isEmail(whatsappPhoneSupport) ? undefined : `https://wa.me/${whatsappPhoneSupport.replace(/[^\d]/g, "")}`}
            tooltipTitle={isEmail(whatsappPhoneSupport) ? "Enviar Queja" : "WhatsApp Averias"}
            ariaLabel={isEmail(whatsappPhoneSupport) ? "Enviar Queja" : "WhatsApp Averias"}
            onClick={handleWhatsAppSupportClick}
          />
        )}
        {facebookUrl && (
          <ContactFloat
            icon={<FacebookIcon />}
            link={facebookUrl}
            tooltipTitle="Visitar Facebook"
            ariaLabel="Visitar Facebook"
            onClick={isAuthenticated ? handleEditFacebook : undefined}
          />
        )}
      </Box>
    </Box>
  );
};

export default ContactsContainer;
