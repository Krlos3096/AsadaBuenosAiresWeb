import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import './Footer.scss';
import Wave from 'react-wavify';

export default function Footer() {
  return (
    <React.Fragment>
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          height: { xs: "25%", md: "15%" },
        }}
      >
        <Wave mask="url(#mask)" fill="#1f7a1f">
          <defs>
            <linearGradient id="gradient" gradientTransform="rotate(90)">
              <stop offset="0" stopColor="white" />
              <stop offset="0.5" stopColor="black" />
            </linearGradient>
            <mask id="mask">
              <rect
                x="0"
                y="0"
                width="2000"
                height="200"
                fill="url(#gradient)"
              />
            </mask>
          </defs>
        </Wave>
      </Box>
      <Container
        maxWidth={false}
        sx={{
          position: "fixed",
          bottom: 0,
          right: 0,
          left: 0,
          backgroundColor: "white",
          zIndex: 1000,
          width: { xs: "100%", md: "50%" },
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
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
              color: "primary.main", // Match AppBar primary color
            }}
          />
          <Typography
            variant="body1"
            sx={{
              textAlign: "center",
              color: "text.secondary",
              fontSize: "0.875rem",
            }}
          >
            Esta página fue creada con amor por el agua potable y la comunidad
            de buenosaires
          </Typography>
        </Box>
      </Container>
    </React.Fragment>
  );
}
