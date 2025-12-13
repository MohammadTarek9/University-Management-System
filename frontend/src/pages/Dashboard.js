import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import {
  School,
  People,
  Forum,
  AccountCircle,
  MeetingRoom
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modules = [
      {
      title: 'Facilities Module',
      description: 'Manage classrooms, laboratories, and administrative offices',
      icon: <MeetingRoom color="primary" />,
      color: '#1976d2',
      features: ['Room Management', 'Equipment Tracking', 'Resource Allocation'],
      path: '/facilities',
      available: ['admin', 'staff', 'professor', 'student'].includes(user?.role) 
    },
    {
      title: 'Curriculum Module',
      description: 'Core subjects, electives, and assessment management',
      icon: <School color="secondary" />,
      color: '#dc004e',
      features: ['Course Catalog', 'Technology Integration', 'Assessment Tools'],
      path: '/curriculum',
      available: ['admin', 'staff', 'professor'].includes(user?.role)
    },
    {
      title: 'Staff Module',
      description: 'Professor and staff management system',
      icon: <People color="success" />,
      color: '#2e7d32',
      features: ['Faculty Directory', 'Performance Tracking', 'HR Integration'],
      path: '/staff',
      available: false
    },
    {
      title: 'Community Module',
      description: 'Communication and collaboration platform',
      icon: <Forum color="warning" />,
      color: '#ed6c02',
      features: ['Parent Communication', 'Student Forums', 'Announcements'],
      path: '/community',
      available: false
    }
  ];

  const getRoleDisplayName = (role) => {
    const roleMap = {
      student: 'Student',
      professor: 'Professor',
      admin: 'Administrator',
      staff: 'Staff Member',
      parent: 'Parent',
      ta: 'Teaching Assistant'
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      student: 'primary',
      professor: 'secondary',
      admin: 'error',
      staff: 'warning',
      parent: 'info',
      ta: 'success'
    };
    return colorMap[role] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Paper
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
          color: 'white'
        }}
      >
        <Avatar sx={{ width: 64, height: 64, mr: 3, bgcolor: 'rgba(255,255,255,0.2)' }}>
          <AccountCircle sx={{ fontSize: 40 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {user?.firstName} {user?.lastName}!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={getRoleDisplayName(user?.role)}
              color={getRoleColor(user?.role)}
              variant="filled"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            {user?.department && (
              <Typography variant="body1">
                Department: {user.department}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* System Overview */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        University Management System Modules
      </Typography>

      <Grid container spacing={3}>
        {modules.map((module, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {module.icon}
                  <Typography variant="h6" component="h3" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {module.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {module.description}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Key Features:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {module.features.map((feature, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: 'text.secondary' }}>
                      • {feature}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained"
                  sx={{ 
                    bgcolor: module.color,
                    '&:hover': {
                      bgcolor: module.color,
                      opacity: 0.8
                    }
                  }}
                  disabled={!module.available}
                  onClick={() => module.available && navigate(module.path)}
                >
                  {module.available ? 'Access Module' : 'Coming Soon'}
                </Button>
                <Button size="small" color="primary">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Admin Quick Actions */}
      {user?.role === 'admin' && (
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Administrator Tools
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => window.location.href = '/admin/users'}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <People sx={{ mr: 1 }} />
                    <Typography variant="h6">User Management</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Add, edit, and manage user accounts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/curriculum')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <School sx={{ mr: 1 }} />
                    <Typography variant="h6">Curriculum Management</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Manage departments, subjects, and courses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* System Status */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                ✅
              </Typography>
              <Typography variant="body2">Authentication System</Typography>
              <Typography variant="caption" color="text.secondary">Active</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                🚧
              </Typography>
              <Typography variant="body2">Facilities Module</Typography>
              <Typography variant="caption" color="text.secondary">In Development</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                🚧
              </Typography>
              <Typography variant="body2">Curriculum Module</Typography>
              <Typography variant="caption" color="text.secondary">In Development</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                🚧
              </Typography>
              <Typography variant="body2">Staff & Community</Typography>
              <Typography variant="caption" color="text.secondary">In Development</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;