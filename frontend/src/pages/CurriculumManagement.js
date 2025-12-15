import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  MenuItem
} from '@mui/material';
import {
  School,
  Category,
  MenuBook,
  Search,
  Add,
  Edit,
  Delete,
  Refresh
} from '@mui/icons-material';
import { departmentService } from '../services/departmentService';
import { subjectService } from '../services/subjectService';
import { courseService } from '../services/courseService';
import { userService } from '../services/userService';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`curriculum-tabpanel-${index}`}
      aria-labelledby={`curriculum-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CourseCatalogManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Department state
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');
  const [departmentPage, setDepartmentPage] = useState(0);
  const [departmentRowsPerPage, setDepartmentRowsPerPage] = useState(10);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentSearchDebounced, setDepartmentSearchDebounced] = useState('');
  const [departmentSuccessMessage, setDepartmentSuccessMessage] = useState('');

  // Add Department Dialog
  const [addDepartmentDialogOpen, setAddDepartmentDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });
  const [addDepartmentLoading, setAddDepartmentLoading] = useState(false);

  // Edit Department Dialog
  const [editDepartmentDialogOpen, setEditDepartmentDialogOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);
  const [editDepartmentLoading, setEditDepartmentLoading] = useState(false);

  // Delete Department Dialog
  const [deleteDepartmentDialogOpen, setDeleteDepartmentDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [deleteDepartmentLoading, setDeleteDepartmentLoading] = useState(false);

  // Subject state
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');
  const [subjectPage, setSubjectPage] = useState(0);
  const [subjectRowsPerPage, setSubjectRowsPerPage] = useState(10);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectSearchDebounced, setSubjectSearchDebounced] = useState('');
  const [subjectSuccessMessage, setSubjectSuccessMessage] = useState('');
  const [allDepartments, setAllDepartments] = useState([]); // For dropdowns

  // Add Subject Dialog
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: '',
    credits: '',
    classification: 'core',
    departmentId: '',
    isActive: true,
    semester: '',        
    academicYear: ''     
  });
  const [addSubjectLoading, setAddSubjectLoading] = useState(false);

  // Edit Subject Dialog
  const [editSubjectDialogOpen, setEditSubjectDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [editSubjectLoading, setEditSubjectLoading] = useState(false);

  // Delete Subject Dialog
  const [deleteSubjectDialogOpen, setDeleteSubjectDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [deleteSubjectLoading, setDeleteSubjectLoading] = useState(false);

  // Course state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [coursePage, setCoursePage] = useState(0);
  const [courseRowsPerPage, setCourseRowsPerPage] = useState(10);
  const [totalCourses, setTotalCourses] = useState(0);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSearchDebounced, setCourseSearchDebounced] = useState('');
  const [courseSuccessMessage, setCourseSuccessMessage] = useState('');
  const [allSubjects, setAllSubjects] = useState([]); // For dropdowns
  const [allInstructors, setAllInstructors] = useState([]); // For dropdowns

  // Add Course Dialog
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    subjectId: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    instructorId: '',
    maxEnrollment: 30,
    schedule: '',
    isActive: true
  });
  const [addCourseLoading, setAddCourseLoading] = useState(false);

  // Edit Course Dialog
  const [editCourseDialogOpen, setEditCourseDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [editCourseLoading, setEditCourseLoading] = useState(false);

  // Delete Course Dialog
  const [deleteCourseDialogOpen, setDeleteCourseDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteCourseLoading, setDeleteCourseLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Debounce department search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDepartmentSearchDebounced(departmentSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [departmentSearch]);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      setDepartmentsError('');

      const params = {
        page: departmentPage + 1,
        limit: departmentRowsPerPage,
        search: departmentSearchDebounced
      };

      const response = await departmentService.getAllDepartments(params);
      setDepartments(response.data.departments);
      setTotalDepartments(response.data.pagination.totalDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartmentsError(error.message || 'Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  }, [departmentPage, departmentRowsPerPage, departmentSearchDebounced]);

  useEffect(() => {
    if (currentTab === 0) {
      fetchDepartments();
    }
  }, [currentTab, fetchDepartments]);

  useEffect(() => {
    if (departmentSuccessMessage) {
      const timer = setTimeout(() => setDepartmentSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [departmentSuccessMessage]);

  // Department handlers
  const handleDepartmentPageChange = (event, newPage) => {
    setDepartmentPage(newPage);
  };

  const handleDepartmentRowsPerPageChange = (event) => {
    setDepartmentRowsPerPage(parseInt(event.target.value, 10));
    setDepartmentPage(0);
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name || !newDepartment.code) {
      setDepartmentsError('Name and code are required');
      return;
    }

    setAddDepartmentLoading(true);
    setDepartmentsError('');

    try {
      await departmentService.createDepartment(newDepartment);
      setAddDepartmentDialogOpen(false);
      setNewDepartment({ name: '', code: '', description: '', isActive: true });
      setDepartmentSuccessMessage(`Department '${newDepartment.name}' created successfully`);
      fetchDepartments();
    } catch (error) {
      setDepartmentsError(error.message || 'Failed to create department');
    } finally {
      setAddDepartmentLoading(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!editDepartment.name || !editDepartment.code) {
      setDepartmentsError('Name and code are required');
      return;
    }

    setEditDepartmentLoading(true);
    setDepartmentsError('');

    try {
      await departmentService.updateDepartment(editDepartment.id, editDepartment);
      setEditDepartmentDialogOpen(false);
      setEditDepartment(null);
      setDepartmentSuccessMessage(`Department '${editDepartment.name}' updated successfully`);
      fetchDepartments();
    } catch (error) {
      setDepartmentsError(error.message || 'Failed to update department');
    } finally {
      setEditDepartmentLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    setDeleteDepartmentLoading(true);
    setDepartmentsError('');

    try {
      await departmentService.deleteDepartment(departmentToDelete.id);
      setDeleteDepartmentDialogOpen(false);
      setDepartmentToDelete(null);
      setDepartmentSuccessMessage(`Department '${departmentToDelete.name}' deleted successfully`);
      fetchDepartments();
    } catch (error) {
      setDepartmentsError(error.message || 'Failed to delete department');
    } finally {
      setDeleteDepartmentLoading(false);
    }
  };

  const openEditDepartmentDialog = (department) => {
    setEditDepartment({ ...department });
    setEditDepartmentDialogOpen(true);
  };

  const openDeleteDepartmentDialog = (department) => {
    setDepartmentToDelete(department);
    setDeleteDepartmentDialogOpen(true);
  };

  // Subject functions
  const fetchAllDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getAllDepartments({ limit: 100 });
      setAllDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments for dropdown:', error);
    }
  }, []);

  // Debounce subject search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSubjectSearchDebounced(subjectSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [subjectSearch]);

  const fetchSubjects = useCallback(async () => {
    try {
      setSubjectsLoading(true);
      setSubjectsError('');

      const params = {
        page: subjectPage + 1,
        limit: subjectRowsPerPage,
        search: subjectSearchDebounced
      };

      const response = await subjectService.getAllSubjects(params);
      setSubjects(response.data.subjects);
      setTotalSubjects(response.data.pagination.totalSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjectsError(error.message || 'Failed to load subjects');
    } finally {
      setSubjectsLoading(false);
    }
  }, [subjectPage, subjectRowsPerPage, subjectSearchDebounced]);

  useEffect(() => {
    if (currentTab === 1) {
      fetchSubjects();
      fetchAllDepartments();
    }
  }, [currentTab, fetchSubjects, fetchAllDepartments]);

  useEffect(() => {
    if (subjectSuccessMessage) {
      const timer = setTimeout(() => setSubjectSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [subjectSuccessMessage]);

  const handleSubjectPageChange = (event, newPage) => {
    setSubjectPage(newPage);
  };

  const handleSubjectRowsPerPageChange = (event) => {
    setSubjectRowsPerPage(parseInt(event.target.value, 10));
    setSubjectPage(0);
  };

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.credits || !newSubject.departmentId) {
      setSubjectsError('Name, code, credits, and department are required');
      return;
    }

    setAddSubjectLoading(true);
    setSubjectsError('');
    // Add this console log to see what's being sent
  console.log('Sending subject data:', newSubject);

    try {
      await subjectService.createSubject(newSubject);
      setAddSubjectDialogOpen(false);
      setNewSubject({
        name: '',
        code: '',
        description: '',
        credits: '',
        classification: 'core',
        departmentId: '',
        isActive: true,
        semester: '',        
        academicYear: '' 
      });
      setSubjectSuccessMessage(`Subject '${newSubject.name}' created successfully`);
      fetchSubjects();
    } catch (error) {
      setSubjectsError(error.message || 'Failed to create subject');
    } finally {
      setAddSubjectLoading(false);
    }
  };

const handleEditSubject = async () => {
  if (
    !editSubject.name ||
    !editSubject.code ||
    !editSubject.credits ||
    !editSubject.departmentId
  ) {
    setSubjectsError('Name, code, credits, and department are required');
    return;
  }

  setEditSubjectLoading(true);
  setSubjectsError('');

  try {
    await subjectService.updateSubject(editSubject.id, editSubject);

    // Always sync semester, including clearing it
    let semesterPayload;
    if (!editSubject.semester || editSubject.semester === 'None') {
      // User chose None → clear semester and academic year
      semesterPayload = { semester: null, academicYear: null };
    } else {
      // User chose a real semester; academic year is optional
      semesterPayload = {
        semester: editSubject.semester,
        academicYear: editSubject.academicYear || null,
      };
    }

    await subjectService.updateSubjectSemester(editSubject.id, semesterPayload);

    setEditSubjectDialogOpen(false);
    setEditSubject(null);
    setSubjectSuccessMessage(`Subject '${editSubject.name}' updated successfully`);
    fetchSubjects();
  } catch (error) {
    setSubjectsError(error.message || 'Failed to update subject');
  } finally {
    setEditSubjectLoading(false);
  }
};


  const handleDeleteSubject = async () => {
    setDeleteSubjectLoading(true);
    setSubjectsError('');

    try {
      await subjectService.deleteSubject(subjectToDelete.id);
      setDeleteSubjectDialogOpen(false);
      setSubjectToDelete(null);
      setSubjectSuccessMessage(`Subject '${subjectToDelete.name}' deleted successfully`);
      fetchSubjects();
    } catch (error) {
      setSubjectsError(error.message || 'Failed to delete subject');
    } finally {
      setDeleteSubjectLoading(false);
    }
  };

  const openEditSubjectDialog = (subject) => {
    setEditSubject({ ...subject });
    setEditSubjectDialogOpen(true);
  };

  const openDeleteSubjectDialog = (subject) => {
    setSubjectToDelete(subject);
    setDeleteSubjectDialogOpen(true);
  };

  // Course functions
  const fetchAllSubjects = useCallback(async () => {
    try {
      const response = await subjectService.getAllSubjects({ limit: 100 });
      setAllSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects for dropdown:', error);
    }
  }, []);

  const fetchAllInstructors = useCallback(async () => {
    try {
      const response = await userService.getAllUsers({ limit: 100 });
      // Filter to only professors, TAs, and admins
      const instructors = response.data.users.filter(user => 
        ['professor', 'ta', 'admin'].includes(user.role)
      );
      setAllInstructors(instructors);
    } catch (error) {
      console.error('Error fetching instructors for dropdown:', error);
    }
  }, []);

  // Debounce course search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCourseSearchDebounced(courseSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [courseSearch]);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      setCoursesError('');

      const params = {
        page: coursePage + 1,
        limit: courseRowsPerPage,
        search: courseSearchDebounced
      };

      const response = await courseService.getAllCourses(params);
      
      // Flatten the nested structure from backend
      const flattenedCourses = response.data.courses.map(course => ({
        ...course,
        subjectName: course.subject?.name || '',
        subjectCode: course.subject?.code || '',
        instructorName: course.instructor 
          ? `${course.instructor.firstName} ${course.instructor.lastName}`
          : null,
        departmentName: course.department?.name || ''
      }));
      
      setCourses(flattenedCourses);
      setTotalCourses(response.data.pagination.totalCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCoursesError(error.message || 'Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  }, [coursePage, courseRowsPerPage, courseSearchDebounced]);

  useEffect(() => {
    if (currentTab === 2) {
      fetchCourses();
      fetchAllSubjects();
      fetchAllInstructors();
    }
  }, [currentTab, fetchCourses, fetchAllSubjects, fetchAllInstructors]);

  useEffect(() => {
    if (courseSuccessMessage) {
      const timer = setTimeout(() => setCourseSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [courseSuccessMessage]);

  const handleCoursePageChange = (event, newPage) => {
    setCoursePage(newPage);
  };

  const handleCourseRowsPerPageChange = (event) => {
    setCourseRowsPerPage(parseInt(event.target.value, 10));
    setCoursePage(0);
  };

  const handleAddCourse = async () => {
    setAddCourseLoading(true);
    setCoursesError('');

    try {
      await courseService.createCourse(newCourse);
      setAddCourseDialogOpen(false);
      setNewCourse({
        subjectId: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        instructorId: '',
        maxEnrollment: 30,
        schedule: '',
        isActive: true
      });
      setCourseSuccessMessage('Course created successfully');
      fetchCourses();
    } catch (error) {
      setCoursesError(error.message || 'Failed to create course');
    } finally {
      setAddCourseLoading(false);
    }
  };

  const handleEditCourse = async () => {
    setEditCourseLoading(true);
    setCoursesError('');

    try {
      await courseService.updateCourse(editCourse.id, editCourse);
      setEditCourseDialogOpen(false);
      setEditCourse(null);
      setCourseSuccessMessage('Course updated successfully');
      fetchCourses();
    } catch (error) {
      setCoursesError(error.message || 'Failed to update course');
    } finally {
      setEditCourseLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    setDeleteCourseLoading(true);
    setCoursesError('');

    try {
      await courseService.deleteCourse(courseToDelete.id);
      setDeleteCourseDialogOpen(false);
      setCourseToDelete(null);
      setCourseSuccessMessage(`Course deleted successfully`);
      fetchCourses();
    } catch (error) {
      setCoursesError(error.message || 'Failed to delete course');
    } finally {
      setDeleteCourseLoading(false);
    }
  };

  const openEditCourseDialog = (course) => {
    setEditCourse({ ...course });
    setEditCourseDialogOpen(true);
  };

  const openDeleteCourseDialog = (course) => {
    setCourseToDelete(course);
    setDeleteCourseDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <School sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Course Catalog Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage departments, subjects, and course offerings
            </Typography>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            aria-label="curriculum management tabs"
          >
            <Tab 
              icon={<Category />} 
              label="Departments" 
              iconPosition="start"
              id="curriculum-tab-0"
              aria-controls="curriculum-tabpanel-0"
            />
            <Tab 
              icon={<MenuBook />} 
              label="Subjects" 
              iconPosition="start"
              id="curriculum-tab-1"
              aria-controls="curriculum-tabpanel-1"
            />
            <Tab 
              icon={<School />} 
              label="Courses" 
              iconPosition="start"
              id="curriculum-tab-2"
              aria-controls="curriculum-tabpanel-2"
            />
          </Tabs>
        </Box>
      </Paper>

      <TabPanel value={currentTab} index={0}>
        <Paper sx={{ p: 3 }}>
          {/* Header and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Departments</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDepartmentDialogOpen(true)}
              >
                Add Department
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchDepartments}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Success Message */}
          {departmentSuccessMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setDepartmentSuccessMessage('')}>
              {departmentSuccessMessage}
            </Alert>
          )}

          {/* Error Message */}
          {departmentsError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDepartmentsError('')}>
              {departmentsError}
            </Alert>
          )}

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search departments by name or code..."
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />

          {/* Table */}
          {departmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No departments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((dept) => (
                        <TableRow key={dept.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {dept.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{dept.name}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                              {dept.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={dept.isActive ? 'Active' : 'Inactive'}
                              color={dept.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEditDepartmentDialog(dept)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDepartmentDialog(dept)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalDepartments}
                page={departmentPage}
                onPageChange={handleDepartmentPageChange}
                rowsPerPage={departmentRowsPerPage}
                onRowsPerPageChange={handleDepartmentRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </Paper>

        {/* Add Department Dialog */}
        <Dialog open={addDepartmentDialogOpen} onClose={() => setAddDepartmentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Name"
                  required
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Code"
                  required
                  placeholder="e.g., CS, ENG, BUS"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDepartmentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddDepartment}
              disabled={addDepartmentLoading}
            >
              {addDepartmentLoading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Department Dialog */}
        <Dialog open={editDepartmentDialogOpen} onClose={() => setEditDepartmentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogContent>
            {editDepartment && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Department Name"
                    required
                    value={editDepartment.name}
                    onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Department Code"
                    required
                    value={editDepartment.code}
                    onChange={(e) => setEditDepartment({ ...editDepartment, code: e.target.value.toUpperCase() })}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={editDepartment.description}
                    onChange={(e) => setEditDepartment({ ...editDepartment, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={editDepartment.isActive}
                    onChange={(e) => setEditDepartment({ ...editDepartment, isActive: e.target.value === 'true' })}
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDepartmentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleEditDepartment}
              disabled={editDepartmentLoading}
            >
              {editDepartmentLoading ? <CircularProgress size={24} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Department Dialog */}
        <Dialog open={deleteDepartmentDialogOpen} onClose={() => setDeleteDepartmentDialogOpen(false)}>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogContent>
            {departmentToDelete && (
              <Typography>
                Are you sure you want to delete the department "{departmentToDelete.name}" ({departmentToDelete.code})?
                This action cannot be undone.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDepartmentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteDepartment}
              disabled={deleteDepartmentLoading}
            >
              {deleteDepartmentLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Paper sx={{ p: 3 }}>
          {/* Header and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Subjects</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddSubjectDialogOpen(true)}
              >
                Add Subject
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchSubjects}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Success Message */}
          {subjectSuccessMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubjectSuccessMessage('')}>
              {subjectSuccessMessage}
            </Alert>
          )}

          {/* Error Message */}
          {subjectsError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubjectsError('')}>
              {subjectsError}
            </Alert>
          )}

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search subjects by name or code..."
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />

          {/* Table */}
          {subjectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell>Classification</TableCell>
                      <TableCell>Semester</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No subjects found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject) => (
                        <TableRow key={subject.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {subject.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {subject.departmentName || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {subject.departmentCode || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>{subject.credits}</TableCell>
                          <TableCell>
                            <Chip
                              label={subject.classification === 'core' ? 'Core' : 'Elective'}
                              color={subject.classification === 'core' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                           <TableCell>
                            {subject.semester
                              ? `${subject.semester}${subject.academicYear ? ` ${subject.academicYear}` : ''}`
                             : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subject.isActive ? 'Active' : 'Inactive'}
                              color={subject.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEditSubjectDialog(subject)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteSubjectDialog(subject)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalSubjects}
                page={subjectPage}
                onPageChange={handleSubjectPageChange}
                rowsPerPage={subjectRowsPerPage}
                onRowsPerPageChange={handleSubjectRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </Paper>

        {/* Add Subject Dialog */}
        <Dialog open={addSubjectDialogOpen} onClose={() => setAddSubjectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Code"
                  required
                  placeholder="e.g., CS201, ENG101"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  required
                  value={newSubject.departmentId}
                  onChange={(e) => setNewSubject({ ...newSubject, departmentId: e.target.value })}
                >
                  {allDepartments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Credits"
                  required
                  type="number"
                  inputProps={{ min: 0.5, max: 10, step: 0.5 }}
                  value={newSubject.credits}
                  onChange={(e) => setNewSubject({ ...newSubject, credits: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Classification"
                  required
                  value={newSubject.classification}
                  onChange={(e) => setNewSubject({ ...newSubject, classification: e.target.value })}
                >
                  <MenuItem value="core">Core</MenuItem>
                  <MenuItem value="elective">Elective</MenuItem>
                </TextField>
              </Grid>
               <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Semester"
                  value={newSubject.semester}
                  onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Fall">Fall</MenuItem>
                  <MenuItem value="Spring">Spring</MenuItem>
                  <MenuItem value="Summer">Summer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  placeholder="2025-2026"
                  value={newSubject.academicYear}
                  onChange={(e) => setNewSubject({ ...newSubject, academicYear: e.target.value })}
                  helperText="Format: YYYY-YYYY (optional)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddSubjectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddSubject}
              disabled={addSubjectLoading}
            >
              {addSubjectLoading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Subject Dialog */}
        <Dialog open={editSubjectDialogOpen} onClose={() => setEditSubjectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogContent>
            {editSubject && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject Name"
                    required
                    value={editSubject.name}
                    onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject Code"
                    required
                    value={editSubject.code}
                    onChange={(e) => setEditSubject({ ...editSubject, code: e.target.value.toUpperCase() })}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Department"
                    required
                    value={editSubject.departmentId}
                    onChange={(e) => setEditSubject({ ...editSubject, departmentId: e.target.value })}
                  >
                    {allDepartments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Credits"
                    required
                    type="number"
                    inputProps={{ min: 0.5, max: 10, step: 0.5 }}
                    value={editSubject.credits}
                    onChange={(e) => setEditSubject({ ...editSubject, credits: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Classification"
                    required
                    value={editSubject.classification}
                    onChange={(e) => setEditSubject({ ...editSubject, classification: e.target.value })}
                  >
                    <MenuItem value="core">Core</MenuItem>
                    <MenuItem value="elective">Elective</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Semester"
                    value={editSubject.semester || ''}
                    onChange={(e) =>
                      setEditSubject({ ...editSubject, semester: e.target.value })
                    }
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Academic Year"
                    placeholder="2025-2026"
                    value={editSubject.academicYear || editSubject.academic_year || ''}
                    onChange={(e) =>
                      setEditSubject({ ...editSubject, academicYear: e.target.value })
                    }
                    helperText="Format: YYYY-YYYY (optional)"
                  />
                </Grid>


                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={editSubject.description}
                    onChange={(e) => setEditSubject({ ...editSubject, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={editSubject.isActive ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditSubject({
                    ...editSubject,
                    isActive: e.target.value === 'true',
                     })
                    }
                  >
                 <MenuItem value="true">Active</MenuItem>
                 <MenuItem value="false">Inactive</MenuItem>
                 </TextField>
                </Grid>

              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSubjectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleEditSubject}
              disabled={editSubjectLoading}
            >
              {editSubjectLoading ? <CircularProgress size={24} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Subject Dialog */}
        <Dialog open={deleteSubjectDialogOpen} onClose={() => setDeleteSubjectDialogOpen(false)}>
          <DialogTitle>Delete Subject</DialogTitle>
          <DialogContent>
            {subjectToDelete && (
              <Typography>
                Are you sure you want to delete the subject "{subjectToDelete.name}" ({subjectToDelete.code})?
                This action cannot be undone and may affect existing courses.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteSubjectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteSubject}
              disabled={deleteSubjectLoading}
            >
              {deleteSubjectLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Courses</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddCourseDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              Add Course
            </Button>
            <IconButton onClick={fetchCourses} color="primary">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {courseSuccessMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCourseSuccessMessage('')}>
            {courseSuccessMessage}
          </Alert>
        )}

        {coursesError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCoursesError('')}>
            {coursesError}
          </Alert>
        )}

        <TextField
          fullWidth
          placeholder="Search courses by subject name or code..."
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {coursesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Semester</strong></TableCell>
                    <TableCell><strong>Year</strong></TableCell>
                    <TableCell><strong>Instructor</strong></TableCell>
                    <TableCell><strong>Enrollment</strong></TableCell>
                    <TableCell><strong>Schedule</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No courses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {course.subjectName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {course.subjectCode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={course.semester} 
                            size="small"
                            color={
                              course.semester === 'Fall' ? 'warning' : 
                              course.semester === 'Spring' ? 'success' : 
                              'info'
                            }
                          />
                        </TableCell>
                        <TableCell>{course.year}</TableCell>
                        <TableCell>
                          {course.instructorName || 'Not assigned'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${course.currentEnrollment || 0} / ${course.maxEnrollment}`}
                            size="small"
                            color={
                              (course.currentEnrollment || 0) >= course.maxEnrollment ? 'error' :
                              (course.currentEnrollment || 0) >= course.maxEnrollment * 0.8 ? 'warning' :
                              'success'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {course.schedule || 'TBD'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.isActive ? 'Active' : 'Inactive'}
                            color={course.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditCourseDialog(course)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteCourseDialog(course)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCourses}
              rowsPerPage={courseRowsPerPage}
              page={coursePage}
              onPageChange={handleCoursePageChange}
              onRowsPerPageChange={handleCourseRowsPerPageChange}
            />
          </>
        )}

        {/* Add Course Dialog */}
        <Dialog open={addCourseDialogOpen} onClose={() => !addCourseLoading && setAddCourseDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Subject"
                  value={newCourse.subjectId}
                  onChange={(e) => setNewCourse({ ...newCourse, subjectId: e.target.value })}
                  required
                >
                  {allSubjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Semester"
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                  required
                >
                  <MenuItem value="Fall">Fall</MenuItem>
                  <MenuItem value="Spring">Spring</MenuItem>
                  <MenuItem value="Summer">Summer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Year"
                  value={newCourse.year}
                  onChange={(e) => setNewCourse({ ...newCourse, year: parseInt(e.target.value) })}
                  inputProps={{ min: 2000, max: 2100 }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Instructor"
                  value={newCourse.instructorId}
                  onChange={(e) => setNewCourse({ ...newCourse, instructorId: e.target.value })}
                  required
                >
                  {allInstructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id}>
                      {instructor.firstName} {instructor.lastName} ({instructor.role})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Enrollment"
                  value={newCourse.maxEnrollment}
                  onChange={(e) => setNewCourse({ ...newCourse, maxEnrollment: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 500 }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Schedule"
                  value={newCourse.schedule}
                  onChange={(e) => setNewCourse({ ...newCourse, schedule: e.target.value })}
                  placeholder="e.g., Mon/Wed 10:00-11:30 AM"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddCourseDialogOpen(false)} disabled={addCourseLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddCourse} variant="contained" disabled={addCourseLoading}>
              {addCourseLoading ? <CircularProgress size={24} /> : 'Add Course'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={editCourseDialogOpen} onClose={() => !editCourseLoading && setEditCourseDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogContent>
            {editCourse && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Subject"
                    value={editCourse.subjectId}
                    onChange={(e) => setEditCourse({ ...editCourse, subjectId: e.target.value })}
                    required
                  >
                    {allSubjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Semester"
                    value={editCourse.semester}
                    onChange={(e) => setEditCourse({ ...editCourse, semester: e.target.value })}
                    required
                  >
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Year"
                    value={editCourse.year}
                    onChange={(e) => setEditCourse({ ...editCourse, year: parseInt(e.target.value) })}
                    inputProps={{ min: 2000, max: 2100 }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Instructor"
                    value={editCourse.instructorId}
                    onChange={(e) => setEditCourse({ ...editCourse, instructorId: e.target.value })}
                    required
                  >
                    {allInstructors.map((instructor) => (
                      <MenuItem key={instructor.id} value={instructor.id}>
                        {instructor.firstName} {instructor.lastName} ({instructor.role})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Current Enrollment"
                    value={editCourse.currentEnrollment || 0}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Enrollment"
                    value={editCourse.maxEnrollment}
                    onChange={(e) => setEditCourse({ ...editCourse, maxEnrollment: parseInt(e.target.value) })}
                    inputProps={{ min: editCourse.currentEnrollment || 1, max: 500 }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Schedule"
                    value={editCourse.schedule}
                    onChange={(e) => setEditCourse({ ...editCourse, schedule: e.target.value })}
                    placeholder="e.g., Mon/Wed 10:00-11:30 AM"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={editCourse.isActive}
                    onChange={(e) => setEditCourse({ ...editCourse, isActive: e.target.value === 'true' })}
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditCourseDialogOpen(false)} disabled={editCourseLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditCourse} variant="contained" disabled={editCourseLoading}>
              {editCourseLoading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Course Dialog */}
        <Dialog open={deleteCourseDialogOpen} onClose={() => !deleteCourseLoading && setDeleteCourseDialogOpen(false)}>
          <DialogTitle>Delete Course</DialogTitle>
          <DialogContent>
            {courseToDelete && (
              <>
                <Typography>
                  Are you sure you want to delete this course?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <strong>Subject:</strong> {courseToDelete.subjectName} ({courseToDelete.subjectCode})
                  <br />
                  <strong>Semester:</strong> {courseToDelete.semester} {courseToDelete.year}
                  <br />
                  <strong>Instructor:</strong> {courseToDelete.instructorName}
                </Typography>
                {courseToDelete.currentEnrollment > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Warning: This course has {courseToDelete.currentEnrollment} enrolled student(s).
                  </Alert>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteCourseDialogOpen(false)} disabled={deleteCourseLoading}>
              Cancel
            </Button>
            <Button onClick={handleDeleteCourse} color="error" variant="contained" disabled={deleteCourseLoading}>
              {deleteCourseLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>
    </Container>
  );
};

export default CourseCatalogManagement;
