import React from 'react';
import { Box, Typography, Container, Link, Grid } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              University Management System
            </Typography>
            <Typography variant="body2">
              Comprehensive platform for managing university operations with integrated modules for facilities, curriculum, staff, and community management.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Modules
            </Typography>
            <Typography variant="body2" component="div">
              • Facilities Management<br />
              • Curriculum & Assessment<br />
              • Staff Management<br />
              • Community Platform
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Support
            </Typography>
            <Typography variant="body2" component="div">
              • Help Center<br />
              • Contact IT Support<br />
              • System Status<br />
              • Documentation
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
          <Typography variant="body2" align="center">
            © 2025 University Management System. Built with MERN Stack.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;