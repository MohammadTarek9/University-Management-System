// frontend/src/pages/staff/StaffDirectoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Email,
  Phone,
  LocationOn,
  Person,
  Business,
  Work,
  Refresh,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { staffDirectoryService } from '../services/staffDirectoryService';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const StaffDirectoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    departments: [],
    roles: []
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Extract departments and roles from staff data
  const extractFiltersFromStaff = (staffData) => {
    const departments = [...new Set(
      staffData
        .map(member => member.department)
        .filter(Boolean)
        .sort()
    )];
    
    const roles = [...new Set(
      staffData
        .map(member => member.role)
        .filter(role => ['professor', 'ta', 'staff', 'admin'].includes(role))
        .sort()
    )];
    
    return { departments, roles };
  };

  // Calculate statistics from staff data
  const calculateStatistics = (staffData) => {
    const totalStaff = staffData.length;
    
    const byRole = staffData.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {});
    
    const byDepartment = staffData.reduce((acc, member) => {
      const dept = member.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    return { totalStaff, byRole, byDepartment };
  };

  // Fetch staff directory using service
  const fetchStaffDirectory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: pagination.page + 1,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.department && { department: filters.department }),
        ...(filters.role && { role: filters.role })
      };

      const response = await staffDirectoryService.getStaffDirectory(params);
      
      const staffData = response.staff || [];
      const paginationData = response.pagination || {};
      
      setStaff(staffData);
      setPagination(prev => ({
        ...prev,
        total: paginationData.totalEmployees || staffData.length,
        totalPages: paginationData.totalPages || 1
      }));
      
      // Extract filters from the staff data we received
      if (staffData.length > 0) {
        const extractedFilters = extractFiltersFromStaff(staffData);
        setAvailableFilters(extractedFilters);
      }
      
    } catch (err) {
      const errorMsg = err.message || 'Failed to load staff directory';
      setError(errorMsg);
      console.error('Error fetching staff directory:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchStaffDirectory();
  }, [fetchStaffDirectory]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      department: '',
      role: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'professor': return 'primary';
      case 'ta': return 'secondary';
      case 'admin': return 'error';
      case 'staff': return 'info';
      default: return 'default';
    }
  };

  // Format role display
  const formatRole = (role) => {
    switch (role) {
      case 'professor': return 'Professor';
      case 'ta': return 'Teaching Assistant';
      case 'admin': return 'Administrator';
      case 'staff': return 'Staff';
      default: return role;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  //handle viewing profile
  const handleViewProfile = (staffMember) => {
    // Navigate to the profile view page
    navigate(`/staff/teaching-staff/profiles/${staffMember.id}`);
  };

  // Calculate statistics from current staff data
  const statistics = calculateStatistics(staff);

  if (loading && staff.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Staff Directory
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Find professors and teaching assistants with their contact information and roles
        </Typography>
      </Box>

      {/* Statistics Card */}
      {staff.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Staff Overview</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {statistics.totalStaff}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Staff
                  </Typography>
                </Card>
              </Grid>
              {Object.entries(statistics.byRole).map(([role, count]) => (
                <Grid item xs={6} sm={2} key={role}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color={getRoleColor(role)}>
                      {count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatRole(role)}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      <Card sx={{ mb: 3, p: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
              <TextField
                select
                fullWidth
                label="Department"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {availableFilters.departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Role"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Work />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {availableFilters.roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {formatRole(role)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleResetFilters}
                sx={{ height: '56px' }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" color="text.secondary">
          Showing {staff.length} of {pagination.total} staff members
        </Typography>
        <Chip
          icon={<FilterList />}
          label={`${filters.department || 'All Departments'} • ${formatRole(filters.role) || 'All Roles'}`}
          variant="outlined"
        />
      </Box>

      {/* Staff Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Staff Member</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Contact Information</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Employee ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Actions</TableCell> {/* Add this column */}
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}> {/* Update colSpan to 7 */}
                  <Typography color="text.secondary">
                    {loading ? 'Loading...' : 'No staff members found matching your criteria'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              staff.map((staffMember) => (
                <TableRow 
                  key={staffMember.id}
                  hover
                  sx={{ 
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{ 
                          bgcolor: getRoleColor(staffMember.role),
                          mr: 2,
                          width: 40,
                          height: 40
                        }}
                      >
                        {staffMember.firstName?.charAt(0)}{staffMember.lastName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {staffMember.fullName || `${staffMember.firstName} ${staffMember.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {staffMember.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={formatRole(staffMember.role)}
                      color={getRoleColor(staffMember.role)}
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography>
                        {staffMember.department || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      {staffMember.phoneNumber && staffMember.phoneNumber !== 'N/A' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {staffMember.phoneNumber}
                            {staffMember.phoneExtension && staffMember.phoneExtension !== 'N/A' && ` ext. ${staffMember.phoneExtension}`}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {staffMember.email}
                        </Typography>
                      </Box>
                      {staffMember.officeLocation && staffMember.officeLocation !== 'N/A' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {staffMember.officeLocation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {staffMember.employeeId || 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={staffMember.isActive ? 'Active' : 'Inactive'}
                      color={staffMember.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {staffMember.lastLogin && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Last active: {formatDate(staffMember.lastLogin)}
                      </Typography>
                    )}
                  </TableCell>
                  
                  {/* Add Actions Cell */}
                  <TableCell>
                    {/* Only show View Profile for professors and TAs */}
                    {['professor', 'ta'].includes(staffMember.role) && (
                      <Tooltip title="View Teaching Staff Profile">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewProfile(staffMember)}
                        >
                          View Profile
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {staff.length > 0 && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      )}

      {/* Help/Info Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                About the Staff Directory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This directory includes all professors, teaching assistants, and administrative staff. 
                You can filter by department or role to find specific staff members. 
                Contact information is updated regularly by the HR department.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StaffDirectoryPage;