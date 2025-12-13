import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const CourseMaterials = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MenuBook sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Course Materials & Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access course materials and submit assignments
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Course materials and assessment features are under development.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CourseMaterials;
