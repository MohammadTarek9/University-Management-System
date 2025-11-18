import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip
} from '@mui/material';
import {
  MeetingRoom,
  School,
  Assignment,
  Business,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Facilities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const facilityModules = [
    {
      id: 'rooms',
      title: 'Room Management',
      description: 'Manage classrooms, laboratories, and other facility spaces. View room details, track capacity, and monitor availability.',
      icon: <MeetingRoom sx={{ fontSize: 40 }} />,
      path: '/facilities/rooms',
      color: 'primary',
      permissions: ['admin', 'staff', 'professor'],
      features: ['Add/Edit Rooms', 'Track Capacity', 'Monitor Status', 'Equipment Management']
    },
    {
      id: 'bookings',
      title: 'Room Booking',
      description: 'Schedule and manage room reservations. Book spaces for classes, events, and meetings with conflict detection.',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      path: '/facilities/bookings',
      color: 'secondary',
      permissions: ['admin', 'staff', 'professor'],
      features: ['Schedule Rooms', 'Manage Reservations', 'Conflict Detection', 'Calendar View'],
      //comingSoon: true
    },
    {
      id: 'resources',
      title: 'Resource Allocation',
      description: 'Track and allocate equipment, software licenses, and other resources across departments and faculty.',
      icon: <Business sx={{ fontSize: 40 }} />,
      path: '/facilities/resources',
      color: 'info',
      permissions: ['admin', 'staff'],
      features: ['Equipment Tracking', 'License Management', 'Department Allocation', 'Usage Reports'],
      comingSoon: true
    },
    {
      id: 'maintenance',
      title: 'Maintenance Management',
      description: 'Report and track maintenance issues. Schedule routine maintenance and monitor facility conditions.',
      icon: <School sx={{ fontSize: 40 }} />,
      path: '/facilities/maintenance',
      color: 'warning',
      permissions: ['admin', 'staff'],
      features: ['Issue Reporting', 'Maintenance Scheduling', 'Status Tracking', 'Work Orders'],
      comingSoon: true
    }
  ];

  // Check user permissions for each module
  const canAccessModule = (modulePermissions) => {
    return modulePermissions.includes(user?.role);
  };

  // Handle module navigation
  const handleModuleClick = (module) => {
    if (!module.comingSoon && canAccessModule(module.permissions)) {
      navigate(module.path);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Facilities Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Comprehensive management of university infrastructure and resources
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access tools for room management, booking systems, resource allocation, and maintenance tracking
        </Typography>
      </Box>

      {/* Module Cards */}
      <Grid container spacing={3}>
        {facilityModules.map((module) => (
          <Grid item xs={12} md={6} key={module.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: (!module.comingSoon && canAccessModule(module.permissions)) ? 'pointer' : 'default',
                opacity: !canAccessModule(module.permissions) ? 0.6 : 1,
                '&:hover': (!module.comingSoon && canAccessModule(module.permissions)) ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                } : {}
              }}
              onClick={() => handleModuleClick(module)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${module.color}.main`, mr: 2 }}>
                    {module.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {module.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {module.comingSoon && (
                        <Chip label="Coming Soon" color="warning" size="small" />
                      )}
                      {!canAccessModule(module.permissions) && (
                        <Chip label="Access Restricted" color="error" size="small" />
                      )}
                      {!module.comingSoon && canAccessModule(module.permissions) && (
                        <Chip label="Available" color="success" size="small" />
                      )}
                    </Box>
                  </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Features:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {module.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      variant="outlined"
                      color={module.color}
                    />
                  ))}
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={!module.comingSoon && canAccessModule(module.permissions) ? "contained" : "outlined"}
                  color={module.color}
                  disabled={module.comingSoon || !canAccessModule(module.permissions)}
                  endIcon={<ArrowForward />}
                  onClick={() => handleModuleClick(module)}
                >
                  {module.comingSoon ? 'Coming Soon' : 
                   !canAccessModule(module.permissions) ? 'Access Restricted' : 
                   'Access Module'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Access Information */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Access Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your current role: <strong>{user?.role}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          • <strong>Administrators:</strong> Full access to all facility management features
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Staff:</strong> Access to room management, bookings, and resource allocation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Professors:</strong> View rooms and create bookings
        </Typography>
      </Box>
    </Container>
  );
};

export default Facilities;