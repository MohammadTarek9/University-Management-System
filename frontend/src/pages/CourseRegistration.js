import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box
} from '@mui/material';
import { Assignment } from '@mui/icons-material';

const CourseRegistration = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Assignment sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Course Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse and register for available courses
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Course registration functionality is under development.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CourseRegistration;
