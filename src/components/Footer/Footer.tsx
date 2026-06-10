import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import './Footer.scss';
import ContactsContainer from '../ContactsContainer';

export default function Footer() {
  return (
    <React.Fragment>
      <Container
        maxWidth={false}
        sx={{
          position: "fixed",
          bottom: 0,
          right: 0,
          left: 0,
          backgroundColor: "#042f04",
          zIndex: 1000,
          width: "100%",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <ContactsContainer />
        <Box
          sx={{
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <FavoriteIcon
            sx={{
              fontSize: "2rem",
              color: "white",
              fontWeight: 700,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              textAlign: "center",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 700,
            }}
          >
            Esta página fue creada con amor por el agua potable y la comunidad
            de Buenos Aires
          </Typography>
        </Box>
      </Container>
    </React.Fragment>
  );
}
