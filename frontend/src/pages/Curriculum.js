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
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Curriculum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const curriculumModules = [
    {
      id: 'catalog',
      title: 'Course Catalog Management',
      description: 'Manage departments, subjects, and course offerings. Assign instructors to courses and control semester availability.',
      icon: <School sx={{ fontSize: 40 }} />,
      path: '/curriculum/catalog',
      color: 'primary',
      permissions: ['admin', 'staff'],
      features: ['Department Management', 'Subject Catalog', 'Course Scheduling', 'Instructor Assignment']
    },
    {
      id: 'registration',
      title: 'Course Registration',
      description: 'Students browse and register for courses. Admin and staff approve registration requests and manage enrollment workflow.',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      path: '/curriculum/registration',
      color: 'secondary',
      permissions: ['admin', 'staff', 'student', 'professor'],
      features: ['Browse Courses', 'Registration Workflow', 'Approval System', 'Enrollment Management'],
      comingSoon: true
    },
    {
      id: 'materials',
      title: 'Course Materials & Assessments',
      description: 'Faculty upload teaching materials and create assessments. Students access materials and submit work online.',
      icon: <MenuBook sx={{ fontSize: 40 }} />,
      path: '/curriculum/materials',
      color: 'success',
      permissions: ['admin', 'staff', 'professor', 'student', 'ta'],
      features: ['Material Upload', 'Online Assessments', 'Work Submission', 'Resource Library'],
      comingSoon: false
    },
    {
      id: 'grading',
      title: 'Grading & Feedback',
      description: 'Faculty record grades and provide feedback. Students view grades and feedback securely with detailed analytics.',
      icon: <Grade sx={{ fontSize: 40 }} />,
      path: '/curriculum/grading',
      color: 'warning',
      permissions: ['admin', 'staff', 'professor', 'student', 'ta'],
      features: ['Grade Recording', 'Feedback System', 'Secure Grade View', 'Performance Analytics'],
      comingSoon: true
    }
  ];

  // Filter modules to show only what the user has permission to see
  const visibleModules = curriculumModules.filter(module => 
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
          Curriculum Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Core subjects, electives, and assessment management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user?.role === 'student' 
            ? 'Access course registration, materials, and view your grades'
            : user?.role === 'professor'
            ? 'Manage course materials, assessments, and student grading'
            : 'Comprehensive tools for curriculum planning, course management, and academic administration'
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
                cursor: (!module.comingSoon && canAccessModule(module.permissions)) ? 'pointer' : 'default',
                '&:hover': (!module.comingSoon && canAccessModule(module.permissions)) ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease-in-out'
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
                        <Chip label="Coming Soon" color="default" size="small" />
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
            ? 'Use the Course Catalog Management module to set up departments, create subjects, and schedule courses for each semester.'
            : user?.role === 'professor'
            ? 'Upload course materials, create assessments, and manage student grades through the respective modules.'
            : 'Browse available courses, register for subjects, access materials, and view your grades through the modules above.'
          }
        </Typography>
      </Box>
    </Container>
  );
};

export default Curriculum;
