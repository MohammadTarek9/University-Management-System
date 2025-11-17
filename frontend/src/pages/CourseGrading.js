import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box
} from '@mui/material';
import { Grade } from '@mui/icons-material';

const CourseGrading = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Grade sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Grading & Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage grades and provide student feedback
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Grading and feedback features are under development.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CourseGrading;
