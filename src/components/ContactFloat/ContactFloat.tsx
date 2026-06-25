import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import './ContactFloat.scss';

interface ContactFloatProps {
  icon: React.ReactElement;
  link?: string;
  tooltipTitle: string;
  ariaLabel: string;
  target?: '_blank' | '_self';
  onClick?: () => void;
}

const ContactFloat: React.FC<ContactFloatProps> = ({
  icon,
  link,
  tooltipTitle,
  ariaLabel,
  target = '_blank',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (link) {
      if (link.startsWith('mailto:')) {
        window.location.href = link;
      } else {
        window.open(link, target);
      }
    }
  };

  return (
    <Box className="contact-float">
      <Tooltip title={tooltipTitle} placement="right">
        <IconButton
          className="contact-button"
          onClick={handleClick}
          aria-label={ariaLabel}
        >
          {icon}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ContactFloat;
