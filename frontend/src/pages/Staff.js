// src/pages/Staff.js
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
  Chip,
} from '@mui/material';
import {
  RateReview,
  ManageHistory,
  MenuBook,
  Assignment,
  ArrowForward,
  LibraryBooks,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Staff = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
   const isAdmin =
    user?.role === 'admin' ||
    (Array.isArray(user?.roles) && user.roles.includes('admin'));

  const staffModules = [
    {
      id: 'leave',
      title: 'Leave Request Management',
      description:
        'Manage Leave requests for staff members including submission, approval, and tracking of leave balances.',
      icon: <ManageHistory sx={{ fontSize: 40 }} />,
      path: '/staff/leave-requests',
      color: 'primary',
      permissions: ['admin', 'staff', 'professor', 'ta'],
      features: ['Request Leave', 'Leave approvals'],
    },
    {
      id: 'StaffDirectory',
      title: 'Teaching Staff Directory',
      description:
        'Centralized directory of professors and TAs, with their contact information and roles.',
      icon: <MenuBook sx={{ fontSize: 40 }} />,
      path: '/staff/directory',
      color: 'secondary',
      permissions: ['admin', 'staff', 'professor', 'ta', 'student'],
      features: ['View Teaching Staff', 'Find Contact Information'],
    },
    {
      id: 'assign-ta',
      title: 'Assign TA Responsibilities',
      description:
        'Assign courses and duties to your teaching assistants so that responsibilities are clearly distributed.',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      path: '/staff/ta-responsibilities',
      color: 'success',
      permissions: ['professor'],
      features: ['Select TA', 'Choose Course', 'Set Duty & Notes'],
    },
    {
      id: 'my-ta',
      title: 'My TA Responsibilities',
      description: 'View and manage the courses and tasks assigned to you.',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      path: '/staff/my-responsibilities',
      color: 'warning',
      permissions: ['ta'],
      features: ['Course Overview', 'Responsibilities List', 'Notes & Schedule'],
    },

    {
      id: 'performance-admin',
      title: 'Performance Records (Admin)',
      description:
        'Admin interface to manage staff performance records (create, edit, delete).',
      icon: <RateReview sx={{ fontSize: 40 }} />,
      path: '/staff/performance',
      color: 'primary',
      permissions: ['admin'],
      features: ['View Records', 'Create/Edit', 'Delete'],
    },

    {
      id: 'StaffProfile',
      title: 'My Teaching Staff Profile',
      description: 'My contact details and office hours',
      icon: <MenuBook sx={{ fontSize: 40 }} />,
      path: '/staff/teaching-staff/profile/me',
      color: 'info',
      permissions: ['professor', 'ta'],
      features: ['Update Office Hours', 'Update Contact Information'],
    },
    
    {
      id: 'Research',
      title: 'Research Publication Management',
      description: 'Publish and manage your research outputs including papers, articles, books, and conference presentations.',
      icon: <LibraryBooks sx={{ fontSize: 40 }} />,
      path: '/staff/research',
      color: 'success',
      permissions: ['admin', 'staff', 'professor', 'ta'],
      features: ['Publish Research', 'Track Publications', 'Share Outputs']
    },
    {
      id: 'professional-dev',
      title: 'Professional Development Activities',
      description: 'Track your career growth through workshops, certifications, conferences, and training programs.',
      icon: <School sx={{ fontSize: 40 }} />,
      path: '/staff/professional-development',
      color: 'info',
      permissions: ['admin', 'staff', 'professor', 'ta'],
      features: ['Track Activities', 'View Certificates', 'Monitor Progress', 'Career Growth']
    },
    {
  id: 'my-payroll',
  title: 'My Payroll Information',
  description: 'View your current salary breakdown and deductions.',
  icon: <ManageHistory />,
  path: isAdmin ? '/admin/payroll' : `/staff/${user?.id}/payroll`,
  color: 'warning',
  permissions: ['professor', 'ta', 'staff', 'admin'],
  features: ['View Salary', 'Allowances', 'Deductions'],
},
  ];

  const visibleModules = staffModules.filter((m) =>
    m.permissions.includes(user?.role)
  );

  const canAccessModule = (permissions) => permissions.includes(user?.role);

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
            : 'Access limited staff-related information based on your role.'}
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
                  !module.comingSoon && canAccessModule(module.permissions)
                    ? 'pointer'
                    : 'default',
                '&:hover':
                  !module.comingSoon && canAccessModule(module.permissions)
                    ? {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        transition: 'all 0.3s ease-in-out',
                      }
                    : {},
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
                    {!module.comingSoon &&
                      canAccessModule(module.permissions) && (
                        <Chip label="Available" color="success" size="small" />
                      )}
                    {module.comingSoon && (
                      <Chip label="Coming Soon" size="small" />
                    )}
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {module.description}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600 }}
                >
                  Features:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {module.features.map((feature) => (
                    <Chip
                      key={feature}
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
                  variant="contained"
                  color={module.color}
                  endIcon={
                    !module.comingSoon &&
                    canAccessModule(module.permissions) && <ArrowForward />
                  }
                  disabled={
                    module.comingSoon || !canAccessModule(module.permissions)
                  }
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
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.contrastText' }}
        >
          Need Help?
        </Typography>
        <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
          {user?.role === 'admin' || user?.role === 'staff'
            ? 'Use this module to manage professors and TAs, monitor staff performance, publish research records, and handle payroll and leave requests.'
            : user?.role === 'professor' || user?.role === 'ta'
            ? 'View your assigned courses, manage responsibilities, submit leave requests, and access payroll and professional development information.'
            : 'Contact the university administration for staff-related inquiries.'}
        </Typography>
      </Box>
    </Container>
  );
};

export default Staff;
