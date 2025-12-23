// pages/Community.js
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
  Message,
  Announcement,
  Event,
  Forum,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  const communityModules = [
    {
      id: 'parent-messaging',
      title: 'Parent-Teacher Communication',
      description:
        'Communicate with your child\'s teachers, view academic progress, and receive important announcements.',
      icon: <Message sx={{ fontSize: 40 }} />,
      path: '/community/parent-messaging',
      color: 'primary',
      permissions: ['parent'],
      features: ['Send Messages', 'View Teachers', 'Track Communication'],
    },
    {
      id: 'student-staff',
      title: 'Student-Staff Communication',
      description:
        'Ask questions, schedule meetings with professors, and receive academic guidance.',
      icon: <Forum sx={{ fontSize: 40 }} />,
      path: '/community/student-staff',
      color: 'secondary',
      permissions: ['student'],
      features: ['Ask Questions', 'Schedule Meetings', 'Academic Guidance'],
      comingSoon: true,
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description:
        'View university-wide announcements and important updates from faculty and administration.',
      icon: <Announcement sx={{ fontSize: 40 }} />,
      path: '/community/announcements',
      color: 'warning',
      permissions: ['parent', 'student', 'professor', 'ta', 'admin', 'staff'],
      features: ['University News', 'Important Updates', 'Faculty Announcements'],
      comingSoon: true,
    },
    {
      id: 'events',
      title: 'Events & Calendar',
      description:
        'Stay informed about upcoming events, important deadlines, and university activities.',
      icon: <Event sx={{ fontSize: 40 }} />,
      path: '/community/events',
      color: 'success',
      permissions: ['parent', 'student', 'professor', 'ta', 'admin', 'staff'],
      features: ['Event Calendar', 'RSVP', 'Important Dates'],
      comingSoon: true,
    },
  ];

  const visibleModules = communityModules.filter((m) =>
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
          Community & Communication
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          {isParent
            ? 'Stay connected with your child\'s teachers and the university community.'
            : isStudent
            ? 'Connect with your professors and stay informed about campus activities.'
            : 'Communicate with parents, students, and colleagues across the university.'}
        </Typography>
      </Box>

      {/* Module Cards */}
      <Grid container spacing={3}>
        {visibleModules.map((module) => (
          <Grid item xs={12} md={6} lg={4} key={module.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: !module.comingSoon ? 'translateY(-4px)' : 'none',
                  boxShadow: !module.comingSoon ? 6 : 1,
                  cursor: !module.comingSoon ? 'pointer' : 'default',
                },
                opacity: module.comingSoon ? 0.7 : 1,
              }}
              onClick={() => handleModuleClick(module)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    color: `${module.color}.main`,
                  }}
                >
                  {module.icon}
                  <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                    {module.title}
                  </Typography>
                </Box>

                {module.comingSoon && (
                  <Chip
                    label="Coming Soon"
                    color="default"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}

                <Typography variant="body2" color="text.secondary" paragraph>
                  {module.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  {module.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>

              <CardActions>
                {!module.comingSoon ? (
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => handleModuleClick(module)}
                    disabled={!canAccessModule(module.permissions)}
                  >
                    Access
                  </Button>
                ) : (
                  <Button size="small" disabled>
                    Coming Soon
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {visibleModules.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No community features available for your role
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Community;
