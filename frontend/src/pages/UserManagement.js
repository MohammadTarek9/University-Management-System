import React, { useState, useEffect } from 'react';
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
  Refresh
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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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
    phoneNumber: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1, // Backend expects 1-based page numbering
        limit: rowsPerPage,
        search: searchTerm,
        role: roleFilter
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
  };

  // Initial load and when dependencies change
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [page, rowsPerPage, searchTerm, roleFilter, user]);

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

    setAddLoading(true);
    setError('');

    try {
      await userService.createUser(newUser);
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
        phoneNumber: ''
      });
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
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

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

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
              value={searchTerm}
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
                            onClick={() => {/* TODO: Handle edit */}}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton 
                            size="small" 
                            color="error"
                            disabled={tableUser.id === user.id} // Prevent self-deletion
                            onClick={() => {/* TODO: Handle delete */}}
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                helperText="Password must be at least 6 characters"
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
            
            {/* Conditional ID Fields */}
            {newUser.role === 'student' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={newUser.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  required
                  helperText="Enter a unique student identification number"
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
                label="Phone Number"
                value={newUser.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                helperText="Optional: Contact phone number"
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
    </Container>
  );
};

export default UserManagement;