// frontend/src/pages/staff/ViewTeachingStaffProfilePage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  Phone,
  Email,
  Business,
  Person,
  School,
  Class,
  CalendarToday,
  AccessTime,
  Groups,
  Info,
  EmojiEvents,
  CheckCircle,
  Event
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffDirectoryService } from '../services/staffDirectoryService';
import { teachingStaffProfileService } from '../services/teachingStaffProfileService';
import { courseService } from '../services/courseService';
import { format } from 'date-fns';

const ViewTeachingStaffProfilePage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState('');
  const [staffMember, setStaffMember] = useState(null);
  const [teachingProfile, setTeachingProfile] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [coursesError, setCoursesError] = useState('');
  const [profDevData, setProfDevData] = useState(null);
  const [loadingProfDev, setLoadingProfDev] = useState(false);

  // Fetch staff member data
  useEffect(() => {
    if (staffId) {
      fetchStaffMember();
    }
  }, [staffId]);

  // Fetch teaching profile and courses when staff member data is available
  useEffect(() => {
    if (staffMember) {
      console.log('staffMember loaded, fetching related data...', staffMember);
      const isTeaching = ['professor', 'ta'].includes(staffMember.role);
      
      fetchTeachingProfile();
      fetchProfessionalDevelopment();
      
      if (isTeaching) {
        fetchAssignedCourses();
      }
    }
  }, [staffMember]);

  const fetchStaffMember = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await staffDirectoryService.getStaffMember(staffId);
      
      if (response.staffMember) {
        setStaffMember(response.staffMember);
      } else {
        setError('Staff member not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load staff member');
      console.error('Error fetching staff member:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachingProfile = async () => {
    try {
      // Only fetch teaching profile for professors and TAs
      if (staffMember?.role && ['professor', 'ta'].includes(staffMember.role)) {
        const response = await teachingStaffProfileService.getProfileByUserId(staffId);
        
        if (response.profile) {
          setTeachingProfile(response.profile);
        }
      }
    } catch (err) {
      console.error('Error fetching teaching profile:', err);
      // Don't show error for this - it's optional
    }
  };

  const fetchAssignedCourses = async () => {
    try {
        setLoadingCourses(true);
        setCoursesError('');
        
        // Use the working courses service with instructorId filter
        const response = await courseService.getAllCourses({
        instructorId: staffId,
        isActive: 'true'
        });
        
        console.log('Courses API response:', response);
        
        // Extract courses from the response structure
        // response.data contains { courses: [...], pagination: {...} }
        const courses = response.data?.courses || [];
        
        console.log('Extracted courses:', courses);
        if (courses.length > 0) {
        console.log('First course structure:', courses[0]);
        console.log('First course subject:', courses[0].subject);
        }
        
        setAssignedCourses(courses);
        
    } catch (err) {
        console.error('Error fetching courses:', err);
        setCoursesError(err.message || 'Failed to load courses');
        setAssignedCourses([]);
    } finally {
        setLoadingCourses(false);
    }
    };

  const fetchProfessionalDevelopment = async () => {
    try {
      setLoadingProfDev(true);
      const token = localStorage.getItem('token');
      
      console.log('Fetching professional development for staffId:', staffId);
      
      const response = await fetch(
        `http://localhost:5000/api/staff/professional-development/user/${staffId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Professional development response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Professional development data:', data);
        if (data.success) {
          setProfDevData(data.data);
          console.log('Set profDevData:', data.data);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch professional development:', errorData);
      }
    } catch (err) {
      console.error('Error fetching professional development:', err);
      // Don't show error to user, just don't display the section
    } finally {
      setLoadingProfDev(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'professor': return 'primary';
      case 'ta': return 'secondary';
      case 'admin': return 'error';
      case 'staff': return 'info';
      default: return 'default';
    }
  };

  const formatRole = (role) => {
    switch (role) {
      case 'professor': return 'Professor';
      case 'ta': return 'Teaching Assistant';
      case 'admin': return 'Administrator';
      case 'staff': return 'Staff';
      default: return role;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !staffMember) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Staff member not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/staff/directory')}
        >
          Back to Directory
        </Button>
      </Container>
    );
  }

  const isTeachingStaff = ['professor', 'ta'].includes(staffMember.role);
  const isOwnProfile = user?.id === parseInt(staffId);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink component={RouterLink} to="/staff" color="inherit">
            Staff
          </MuiLink>
          <MuiLink component={RouterLink} to="/staff/directory" color="inherit">
            Directory
          </MuiLink>
          <Typography color="text.primary">
            {staffMember.fullName || `${staffMember.firstName} ${staffMember.lastName}`}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Back Button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/staff/directory')}
        sx={{ mb: 3 }}
      >
        Back to Directory
      </Button>

      {/* Header Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  bgcolor: getRoleColor(staffMember.role),
                  width: 80,
                  height: 80,
                  fontSize: '2rem'
                }}
              >
                {staffMember.firstName?.charAt(0)}{staffMember.lastName?.charAt(0)}
              </Avatar>
            </Grid>
            
            <Grid item xs>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {staffMember.fullName || `${staffMember.firstName} ${staffMember.lastName}`}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  label={formatRole(staffMember.role)}
                  color={getRoleColor(staffMember.role)}
                  size="medium"
                  icon={<Person />}
                />
                
                {staffMember.department && (
                  <Chip
                    label={staffMember.department}
                    variant="outlined"
                    size="medium"
                    icon={<Business />}
                  />
                )}
                
                {staffMember.employeeId && (
                  <Chip
                    label={`ID: ${staffMember.employeeId}`}
                    variant="outlined"
                    size="small"
                  />
                )}
                
                <Chip
                  label={staffMember.isActive ? 'Active' : 'Inactive'}
                  color={staffMember.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              {isOwnProfile && isTeachingStaff && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/teaching-staff/profile')}
                  sx={{ mt: 1 }}
                >
                  Edit My Teaching Profile
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column - Contact & Office Information */}
        <Grid item xs={12} md={5}>
          {/* Contact Information Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ mr: 1 }} />
                Contact Information
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Email color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={staffMember.email || 'Not provided'}
                    secondaryTypographyProps={{ style: { wordBreak: 'break-all' } }}
                  />
                </ListItem>
                
                {staffMember.phoneNumber && staffMember.phoneNumber !== 'N/A' && (
                  <ListItem>
                    <ListItemIcon>
                      <Phone color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={staffMember.phoneNumber}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Office Information Card - Only for teaching staff */}
          {isTeachingStaff && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1 }} />
                  Office Information
                </Typography>
                
                {teachingProfile?.officeHours || teachingProfile?.officeLocation ? (
                  <Box>
                    {teachingProfile?.officeHours && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Schedule sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Office Hours
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                              {teachingProfile.officeHours}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    
                    {teachingProfile?.officeLocation && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Office Location
                          </Typography>
                          <Typography variant="body1">
                            {teachingProfile.officeLocation}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary" fontStyle="italic">
                    Office information not provided
                  </Typography>
                )}
                
                {teachingProfile?.updatedAt && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                    Last updated: {formatDate(teachingProfile.updatedAt)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Additional Information Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} />
                Additional Information
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Last Login" 
                    secondary={staffMember.lastLogin ? formatDate(staffMember.lastLogin) : 'Never'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Account Created" 
                    secondary={staffMember.createdAt ? formatDate(staffMember.createdAt) : 'N/A'}
                  />
                </ListItem>
                
                {staffMember.lastLogin && (
                  <ListItem>
                    <ListItemText 
                      primary="Status" 
                      secondary={
                        <Chip
                          label={staffMember.isActive ? 'Active' : 'Inactive'}
                          color={staffMember.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Assigned Courses (Only for teaching staff) */}
        {isTeachingStaff ? (
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Class sx={{ mr: 1 }} />
                  Assigned Courses
                </Typography>
                
                {coursesError && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {coursesError}
                  </Alert>
                )}
                
                {loadingCourses ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : assignedCourses && assignedCourses.length > 0 ? (
                  <List>
                    {assignedCourses.map((course, index) => {
                    // Extract data with fallbacks
                    const courseCode = course.subject?.code || '';
                    const courseName = course.subject?.name || '';
                    const semester = course.semester || '';
                    const year = course.year || '';
                    const schedule = course.schedule || '';
                    const enrollment = course.currentEnrollment !== undefined && course.maxEnrollment !== undefined 
                        ? `${course.currentEnrollment}/${course.maxEnrollment}`
                        : '';
                    
                    // Create full semester/year display
                    const semesterYear = semester && year ? `${semester} ${year}` : semester || year || '';
                    
                    return (
                        <React.Fragment key={course.id || course._id || index}>
                        <ListItem alignItems="flex-start">
                            <ListItemIcon>
                            <School color="primary" />
                            </ListItemIcon>
                            <ListItemText
                            primary={
                                <Typography variant="subtitle1" fontWeight="medium">
                                {courseCode && courseName 
                                    ? `${courseCode} - ${courseName}`
                                    : courseName || courseCode || 'Course'
                                }
                                </Typography>
                            }
                            secondary={
                                <Box sx={{ mt: 1 }}>
                                {semesterYear && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2" component="span">
                                        {semesterYear}
                                    </Typography>
                                    </Box>
                                )}
                                {schedule && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2" component="span">
                                        {schedule}
                                    </Typography>
                                    </Box>
                                )}
                                {enrollment && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <Groups sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text-secondary">
                                        Enrollment: {enrollment}
                                    </Typography>
                                    </Box>
                                )}
                                </Box>
                            }
                            />
                        </ListItem>
                        {index < assignedCourses.length - 1 && (
                            <Divider component="li" />
                        )}
                        </React.Fragment>
                    );
                    })}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No courses assigned for current semester
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check back later for course assignments
                    </Typography>
                  </Box>
                )}
                
                {/* Note about courses */}
                <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Note:</strong> Course assignments are updated at the beginning of each semester. 
                    For the most current course information, check the official course catalog.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
            
            {/* Contact Instructions */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  How to Contact
                </Typography>
                {teachingProfile?.officeHours ? (
                  <>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      1. <strong>During Office Hours:</strong> Visit during the specified office hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      2. <strong>Email:</strong> Use the email address above for non-urgent matters
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      3. <strong>Appointment:</strong> For matters requiring more time, request an appointment via email
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    For inquiries, please contact via email. Office hours information is not currently available.
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  4. <strong>Course Questions:</strong> Use the course's learning management system for course-specific questions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          /* Non-teaching staff message */
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Administrative Staff Member
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This staff member is not assigned teaching responsibilities.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  For administrative matters, please contact via email or phone.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Professional Development Summary */}
      {console.log('profDevData check:', { profDevData, hasStatistics: profDevData?.statistics })}
      {profDevData && profDevData.statistics && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEvents sx={{ mr: 1 }} />
            Professional Development Summary
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Statistics Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmojiEvents color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {profDevData.statistics.total_activities || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Activities
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {profDevData.statistics.completed_count || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {Number(profDevData.statistics.total_hours || 0).toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <School color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {profDevData.statistics.certificates_count || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Certificates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Activities */}
            {profDevData.activities && profDevData.activities.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activities
                    </Typography>
                    <List>
                      {profDevData.activities.slice(0, 5).map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem>
                            <ListItemIcon>
                              {activity.activity_type === 'conference' || activity.activity_type === 'seminar' ? (
                                <Event color="primary" />
                              ) : activity.activity_type === 'certification' || activity.activity_type === 'course' ? (
                                <School color="secondary" />
                              ) : (
                                <EmojiEvents color="action" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2">
                                    {activity.title}
                                  </Typography>
                                  <Chip
                                    label={activity.status}
                                    size="small"
                                    color={
                                      activity.status === 'completed' ? 'success' :
                                      activity.status === 'ongoing' ? 'primary' :
                                      'default'
                                    }
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary" component="span">
                                    {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                                  </Typography>
                                  {activity.start_date && (
                                    <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 2 }}>
                                      • {formatDate(activity.start_date)}
                                    </Typography>
                                  )}
                                  {activity.duration_hours && (
                                    <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 2 }}>
                                      • {activity.duration_hours} hours
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < Math.min(profDevData.activities.length - 1, 4) && <Divider component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                    {isOwnProfile && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/staff/professional-development')}
                        >
                          View All Activities
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ViewTeachingStaffProfilePage;