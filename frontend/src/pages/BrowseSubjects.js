import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MenuBook as MenuBookIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { departmentService } from '../services/departmentService';
import api from '../services/api';

const BrowseSubjects = () => {
  const [currentTab, setCurrentTab] = useState(0); // 0 = All, 1 = Core, 2 = Elective
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Expanded cards
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    fetchDepartments();
    fetchSubjects();
  }, [currentTab, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments({ isActive: true });
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        isActive: true,
        limit: 100
      };
      
      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }
      
      // Filter by classification based on tab
      if (currentTab === 1) {
        params.classification = 'core';
      } else if (currentTab === 2) {
        params.classification = 'elective';
      }

      const response = await api.get('/curriculum/subjects', { params });
      setSubjects(response.data.data.subjects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSubjects();
  };

  const toggleCardExpand = (subjectId) => {
    setExpandedCards(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const filteredSubjects = subjects.filter(subject => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      subject.name?.toLowerCase().includes(search) ||
      subject.code?.toLowerCase().includes(search) ||
      subject.description?.toLowerCase().includes(search)
    );
  });

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'N/A';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SchoolIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Browse Subjects
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Explore all available core and elective subjects to understand your major's requirements
          and choose subjects based on your interests.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="All Subjects" />
          <Tab label="Core Subjects" icon={<StarIcon />} iconPosition="start" />
          <Tab label="Elective Subjects" icon={<MenuBookIcon />} iconPosition="start" />
        </Tabs>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredSubjects.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No subjects found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search term
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
            </Typography>
            
            <Grid container spacing={2}>
              {filteredSubjects.map((subject) => (
                <Grid item xs={12} md={6} lg={4} key={subject.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                          {subject.name}
                        </Typography>
                        <Chip 
                          label={subject.classification === 'core' ? 'CORE' : 'ELECTIVE'}
                          color={subject.classification === 'core' ? 'primary' : 'secondary'}
                          size="small"
                          icon={subject.classification === 'core' ? <StarIcon /> : <MenuBookIcon />}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={subject.code} size="small" variant="outlined" />
                        <Chip label={`${subject.credits} Credits`} size="small" />
                        {subject.labRequired && (
                          <Chip 
                            label="Lab Required" 
                            size="small" 
                            color="warning" 
                            icon={<ScienceIcon />}
                          />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Department:</strong> {getDepartmentName(subject.departmentId)}
                      </Typography>

                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: expandedCards[subject.id] ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {subject.description || 'No description available'}
                      </Typography>

                      <Collapse in={expandedCards[subject.id]}>
                        <Divider sx={{ my: 2 }} />
                        
                        {subject.prerequisites && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Prerequisites:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {subject.prerequisites}
                            </Typography>
                          </Box>
                        )}

                        {subject.corequisites && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Corequisites:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {subject.corequisites}
                            </Typography>
                          </Box>
                        )}

                        {subject.learningOutcomes && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Learning Outcomes:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {subject.learningOutcomes}
                            </Typography>
                          </Box>
                        )}

                        {subject.labRequired && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Lab Information:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Lab Hours: {subject.labHours || 'N/A'} hours per week
                            </Typography>
                          </Box>
                        )}

                        {subject.typicalOffering && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Typically Offered:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {subject.typicalOffering}
                            </Typography>
                          </Box>
                        )}
                      </Collapse>

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleCardExpand(subject.id)}
                        >
                          {expandedCards[subject.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default BrowseSubjects;
