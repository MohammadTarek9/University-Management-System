import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  PersonAdd,
  Add,
  AdminPanelSettings,
  Refresh,
  Warning
} from '@mui/icons-material';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    employeeId: '',
    department: '',
    major: '',
    phoneNumber: '',
    student_id: '' // For parent-child relationship
  });
  const [students, setStudents] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        ...(roleFilter && { role: roleFilter })
      };

      const response = await userService.getAllUsers(params);

      setUsers(response.data.users);
      setTotalUsers(response.data.pagination.totalUsers);

    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, roleFilter]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [fetchUsers, user]);

  useEffect(() => {
    if (user?.role === 'admin' && addDialogOpen) {
      fetchStudents();
    }
  }, [addDialogOpen, user]);

  // Fetch all students for parent dropdown
  const fetchStudents = async () => {
    try {
      const response = await userService.getAllUsers({ role: 'student', limit: 1000 });
      setStudents(response.data.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Check for pre-populated data from student credentials
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prePopulateData = localStorage.getItem('prePopulateUserData');
    
    if (urlParams.get('action') === 'create' && prePopulateData) {
      try {
        const userData = JSON.parse(prePopulateData);
        setNewUser({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          password: userData.temporaryPassword || '',
          role: 'student',
          studentId: userData.studentId || '',
          employeeId: '',
          department: userData.department || '',
          phoneNumber: userData.phoneNumber || '',
          major: userData.major || ''
        });
        setAddDialogOpen(true);
        
        // Clear the stored data
        localStorage.removeItem('prePopulateUserData');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing pre-populate data:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Close dialogs with Escape key
      if (event.key === 'Escape') {
        if (addDialogOpen) setAddDialogOpen(false);
        if (editDialogOpen) setEditDialogOpen(false);
        if (deleteDialogOpen) setDeleteDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addDialogOpen, editDialogOpen, deleteDialogOpen]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      setError('All required fields must be filled');
      return;
    }

    // Validate role-specific IDs
    if (newUser.role === 'student' && !newUser.studentId) {
      setError('Student ID is required for student accounts');
      return;
    }
    if (['professor', 'staff', 'admin', 'ta'].includes(newUser.role) && !newUser.employeeId) {
      setError('Employee ID is required for faculty/staff accounts');
      return;
    }
    if (newUser.role === 'parent' && !newUser.student_id) {
      setError('Please select a student (child) for this parent account');
      return;
    }

    setAddLoading(true);
    setError('');

    try {
      // Add firstLogin and mustChangePassword flags for all new users
      const userData = { 
        ...newUser,
        // Clean up empty ID values to prevent duplicate key errors
        studentId: newUser.studentId?.trim() || undefined,
        employeeId: newUser.employeeId?.trim() || undefined,
        // Always set firstLogin and mustChangePassword flags for new users
        firstLogin: true,
        mustChangePassword: true
      };
      
      console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
      console.log('Role:', userData.role);
      console.log('student_id:', userData.student_id);
      await userService.createUser(userData);
      setAddDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student',
        studentId: '',
        employeeId: '',
        department: '',
        major: '',
        phoneNumber: '',
        student_id: ''
      });
      setSuccessMessage(`User '${newUser.firstName} ${newUser.lastName}' created successfully`);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error('User creation error:', err);
      let errorMessage = 'Failed to create user';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.errors && Array.isArray(err.errors)) {
        errorMessage = err.errors.map(error => error.msg).join(', ');
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setAddLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewUser(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Clear ID fields when role changes to prevent confusion
      if (field === 'role') {
        updated.studentId = '';
        updated.employeeId = '';
      }
      
      return updated;
    });
  };

  const handleEditClick = (user) => {
    setEditUser({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      studentId: user.studentId || '',
      employeeId: user.employeeId || '',
      department: user.department || '',
      major: user.major || '',
      phoneNumber: user.phoneNumber || '',
      isActive: user.isActive
    });
    setEditDialogOpen(true);
  };

  const handleEditInputChange = (field, value) => {
    setEditUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateUser = async () => {
    if (!editUser.firstName || !editUser.lastName || !editUser.email) {
      setError('Name and email are required');
      return;
    }

    // Validate role-specific IDs
    if (editUser.role === 'student' && !editUser.studentId) {
      setError('Student ID is required for student accounts');
      return;
    }
    if (['professor', 'staff', 'admin', 'ta'].includes(editUser.role) && !editUser.employeeId) {
      setError('Employee ID is required for faculty/staff accounts');
      return;
    }

    setEditLoading(true);
    setError('');

    try {
      const updateData = { ...editUser };
      delete updateData.id; // Remove ID from update payload
      
      await userService.updateUser(editUser.id, updateData);
      setEditDialogOpen(false);
      setSuccessMessage(`User '${editUser.firstName} ${editUser.lastName}' updated successfully`);
      setEditUser(null);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    setError('');

    try {
      await userService.deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setSuccessMessage(`User '${userToDelete.firstName} ${userToDelete.lastName}' deleted successfully`);
      setUserToDelete(null);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  //debounce effect for search input
  useEffect(() => {
  const t = setTimeout(() => {
    setSearchTerm(searchInput);
  }, 300);

  return () => clearTimeout(t);
}, [searchInput]);


  // Handle role filter change
  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  // Get role display properties
  const getRoleChipProps = (role) => {
    const roleConfig = {
      student: { color: 'primary', label: 'Student' },
      professor: { color: 'secondary', label: 'Professor' },
      admin: { color: 'error', label: 'Administrator' },
      staff: { color: 'warning', label: 'Staff' },
      parent: { color: 'info', label: 'Parent' },
      ta: { color: 'success', label: 'Teaching Assistant' }
    };
    return roleConfig[role] || { color: 'default', label: role };
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if current user is admin
  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Administrator privileges required to view this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AdminPanelSettings sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setAddDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Add User
        </Button>
        <Tooltip title="Refresh user list">
          <IconButton onClick={fetchUsers} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search users"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="professor">Professor</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="ta">Teaching Assistant</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Users Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm || roleFilter 
                        ? 'No users found matching your search criteria'
                        : 'No users found'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((tableUser) => (
                  <TableRow key={tableUser.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {tableUser.firstName} {tableUser.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tableUser.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {tableUser.studentId && (
                        <Typography variant="body2" color="primary">
                          {tableUser.studentId}
                        </Typography>
                      )}
                      {tableUser.employeeId && (
                        <Typography variant="body2" color="secondary">
                          {tableUser.employeeId}
                        </Typography>
                      )}
                      {!tableUser.studentId && !tableUser.employeeId && (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleChipProps(tableUser.role).label}
                        color={getRoleChipProps(tableUser.role).color}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tableUser.isActive ? 'Active' : 'Inactive'}
                        color={tableUser.isActive ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(tableUser.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Edit user">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditClick(tableUser)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton 
                            size="small" 
                            color="error"
                            disabled={tableUser.id === user.id} // Prevent self-deletion
                            onClick={() => handleDeleteClick(tableUser)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {users.length} of {totalUsers} users
          {(searchTerm || roleFilter) && ' (filtered)'}
        </Typography>
      </Box>

      {/* Add User Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAdd sx={{ mr: 1 }} />
            Add New User
          </Box>
        </DialogTitle>
        <DialogContent>
          {newUser.studentId && newUser.password && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Student Account Creation:</strong> This form has been pre-populated with data from an approved admission application. Please review and complete the remaining fields.
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newUser.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newUser.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={!!(newUser.email && newUser.email.includes('@uni.edu.eg'))} // Disable if university email
                helperText={newUser.email && newUser.email.includes('@uni.edu.eg') ? 
                  "Auto-generated university email address" : 
                  "Enter the user's email address"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={newUser.studentId ? "Temporary Password" : "Password"}
                type="password"
                value={newUser.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                helperText={newUser.studentId ? 
                  "This is the temporary password generated for the student. They will be required to change it on first login." : 
                  "Password must be at least 6 characters and contain uppercase, lowercase, and number"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="professor">Professor</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="ta">Teaching Assistant</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Parent-Student Relationship */}
            {newUser.role === 'parent' && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Child (Student)</InputLabel>
                  <Select
                    value={newUser.student_id}
                    label="Child (Student)"
                    onChange={(e) => handleInputChange('student_id', e.target.value)}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a student</em>
                    </MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.studentId || student.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* Conditional ID Fields */}
            {newUser.role === 'student' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={newUser.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  required
                  disabled={!!(newUser.studentId && newUser.password)} // Disable if pre-populated
                  helperText={newUser.studentId && newUser.password ? 
                    "Auto-generated student ID from admission application" : 
                    "Enter a unique student identification number"
                  }
                />
              </Grid>
            )}
            
            {['professor', 'staff', 'admin', 'ta'].includes(newUser.role) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={newUser.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  required
                  helperText="Enter a unique employee identification number"
                />
              </Grid>
            )}
            
            {/* Optional Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={newUser.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                helperText="Optional: User's department"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Major"
                value={newUser.major}
                onChange={(e) => handleInputChange('major', e.target.value)}
                helperText="Optional: Student's major/specialization"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number *"
                value={newUser.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                helperText="Required: Contact phone number"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAddDialogOpen(false)}
            disabled={addLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddUser}
            variant="contained"
            disabled={addLoading}
            startIcon={addLoading ? <CircularProgress size={20} /> : <Add />}
          >
            {addLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Edit User
          </Box>
        </DialogTitle>
        <DialogContent>
          {editUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editUser.firstName}
                  onChange={(e) => handleEditInputChange('firstName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editUser.lastName}
                  onChange={(e) => handleEditInputChange('lastName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editUser.role}
                    label="Role"
                    onChange={(e) => handleEditInputChange('role', e.target.value)}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="professor">Professor</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="ta">Teaching Assistant</MenuItem>
                    <MenuItem value="parent">Parent</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Conditional ID Fields */}
              {editUser.role === 'student' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    value={editUser.studentId}
                    onChange={(e) => handleEditInputChange('studentId', e.target.value)}
                    required
                    helperText="Enter a unique student identification number"
                  />
                </Grid>
              )}
              
              {['professor', 'staff', 'admin', 'ta'].includes(editUser.role) && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={editUser.employeeId}
                    onChange={(e) => handleEditInputChange('employeeId', e.target.value)}
                    required
                    helperText="Enter a unique employee identification number"
                  />
                </Grid>
              )}
              
              {/* Optional Fields */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={editUser.department}
                  onChange={(e) => handleEditInputChange('department', e.target.value)}
                  helperText="Optional: User's department"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Major"
                  value={editUser.major}
                  onChange={(e) => handleEditInputChange('major', e.target.value)}
                  helperText="Optional: Student's major/specialization"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editUser.phoneNumber}
                  onChange={(e) => handleEditInputChange('phoneNumber', e.target.value)}
                  helperText="Optional: Contact phone number"
                />
              </Grid>
              
              {/* Account Status */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Account Status</InputLabel>
                  <Select
                    value={editUser.isActive}
                    label="Account Status"
                    onChange={(e) => handleEditInputChange('isActive', e.target.value)}
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateUser}
            variant="contained"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : <Edit />}
          >
            {editLoading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <Warning sx={{ mr: 1 }} />
            Confirm Delete User
          </Box>
        </DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this user account? This action cannot be undone.
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User Details:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {userToDelete.firstName} {userToDelete.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userToDelete.email}
                </Typography>
                <Chip 
                  label={getRoleChipProps(userToDelete.role).label} 
                  color={getRoleChipProps(userToDelete.role).color} 
                  size="small"
                  sx={{ mt: 1 }}
                />
                {userToDelete.studentId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Student ID: {userToDelete.studentId}
                  </Typography>
                )}
                {userToDelete.employeeId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Employee ID: {userToDelete.employeeId}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;