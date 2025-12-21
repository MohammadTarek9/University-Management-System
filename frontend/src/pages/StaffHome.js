import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import { AssignmentInd, AssignmentTurnedIn, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StaffHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Staff Module
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Choose an action related to staff and teaching assistants.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Professors: assign TA responsibilities (same logic and path) */}
        {user?.role === 'professor' && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease-in-out',
                },
              }}
              onClick={() => navigate('/staff/ta-responsibilities')}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: 'primary.main', mr: 2 }}>
                    <AssignmentInd sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Assign TA Responsibilities
                    </Typography>
                    <Chip label="Available" color="success" size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Assign courses and duties to your teaching assistants so that
                  responsibilities are clearly distributed.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  endIcon={<ArrowForward />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/staff/ta-responsibilities'); // unchanged
                  }}
                >
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}

        {/* TAs: view own responsibilities (same logic and path) */}
        {user?.role === 'ta' && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease-in-out',
                },
              }}
              onClick={() => navigate('/staff/my-responsibilities')}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: 'primary.main', mr: 2 }}>
                    <AssignmentTurnedIn sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      My TA Responsibilities
                    </Typography>
                    <Chip label="Available" color="success" size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  View and manage the courses and tasks assigned to you.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  endIcon={<ArrowForward />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/staff/my-responsibilities'); // unchanged
                  }}
                >
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default StaffHome;
