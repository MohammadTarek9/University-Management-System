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
  School,
  Assignment,
  MenuBook,
  Grade,
  ArrowForward,
  ManageHistory
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Staff = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const staffModules = [
    {
      id: 'LeaveRequests',
      title: 'Leave Request Management',
      description: 'Manage Leave requests for staff members including submission, approval, and tracking of leave balances.',
      icon: <ManageHistory sx={{ fontSize: 40 }} />,
      path: '/staff/leave-requests',
      color: 'primary',
      permissions: ['admin', 'staff', 'professor', 'ta'],
      features: ['Request Leave', 'Leave approvals']
    },
    {
      id: 'StaffDirectory',
      title: 'Teaching Staff Directory',
      description: 'Centralized directory of professors and TAs, with their contact information and roles.',
      icon: <MenuBook sx={{ fontSize: 40 }} />,
      path: '/staff/directory',
      color: 'secondary',
      permissions: ['admin', 'staff', 'professor', 'ta'],
      features: ['View Teaching Staff', 'Find Contact Information']
    }
  ];

  // Filter modules to show only what the user has permission to see
  const visibleModules = staffModules.filter(module => 
    module.permissions.includes(user?.role)
  );

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
      Staff Management
    </Typography>

    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
      University staff administration & HR services
    </Typography>

    <Typography variant="body1" color="text.secondary">
      {user?.role === 'admin' || user?.role === 'staff'
        ? 'Manage academic staff, track performance, and handle HR and payroll operations.'
        : user?.role === 'professor' || user?.role === 'ta'
        ? 'View assigned courses, manage responsibilities, request leaves, and track professional activities.'
        : 'Access limited staff-related information based on your role.'
      }
    </Typography>
  </Box>

  {/* Module Cards */}
  <Grid container spacing={3}>
    {visibleModules.map((module) => (
      <Grid item xs={12} md={6} key={module.id}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor:
              (!module.comingSoon && canAccessModule(module.permissions))
                ? 'pointer'
                : 'default',
            '&:hover':
              (!module.comingSoon && canAccessModule(module.permissions))
                ? {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    transition: 'all 0.3s ease-in-out'
                  }
                : {}
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
                    <Chip label="Coming Soon" size="small" />
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
              variant={
                (!module.comingSoon && canAccessModule(module.permissions))
                  ? 'contained'
                  : 'outlined'
              }
              color={module.color}
              disabled={module.comingSoon || !canAccessModule(module.permissions)}
              endIcon={!module.comingSoon && <ArrowForward />}
              onClick={(e) => {
                e.stopPropagation();
                handleModuleClick(module);
              }}
            >
              {module.comingSoon ? 'Coming Soon' : 'Access Module'}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    ))}
  </Grid>

  {/* Help Section */}
  <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
    <Typography variant="h6" gutterBottom sx={{ color: 'primary.contrastText' }}>
      Need Help?
    </Typography>

    <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
      {user?.role === 'admin' || user?.role === 'staff'
        ? 'Use this module to manage professors and TAs, monitor staff performance, publish research records, and handle payroll and leave requests.'
        : user?.role === 'professor' || user?.role === 'ta'
        ? 'View your assigned courses, manage responsibilities, submit leave requests, and access payroll and professional development information.'
        : 'Contact the university administration for staff-related inquiries.'
      }
    </Typography>
  </Box>
</Container>

  );
};

export default Staff;
