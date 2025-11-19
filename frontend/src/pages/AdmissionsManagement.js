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
  Card,
  CardContent
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Add,
  CheckCircle,
  Cancel,
  Visibility,
  School,
  FilterList,
  Refresh,
  Assignment,
  TrendingUp
} from '@mui/icons-material';
import { applicationService } from '../services/applicationService';
import { useAuth } from '../context/AuthContext';
import AddApplicationDialog from '../components/admissions/AddApplicationDialog';
import ApplicationViewDialog from '../components/admissions/ApplicationViewDialog';

const AdmissionsManagement = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalApplications, setTotalApplications] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [degreeLevelFilter, setDegreeLevelFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    programs: [],
    degreeLevels: [],
    statuses: [],
    nationalities: []
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Fetch applications from API
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1, // Backend expects 1-based page numbering
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        program: programFilter,
        degreeLevel: degreeLevelFilter
      };

      console.log('Fetching applications with params:', params);
      const response = await applicationService.getAllApplications(params);
      console.log('Applications response:', response);

      if (response.success) {
        setApplications(response.data.applications || []);
        setTotalApplications(response.data.pagination.totalApplications || 0);
      } else {
        setError(response.message || 'Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.status);
      console.error('Current user:', user);
      console.error('Auth token:', localStorage.getItem('token'));
      const errorMessage = error.message || error.response?.data?.message || `Failed to load applications (${error.status || 'Unknown error'})`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch application statistics
  const fetchStats = async () => {
    try {
      const response = await applicationService.getApplicationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await applicationService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Initial load and when dependencies change
  useEffect(() => {
    fetchApplications();
  }, [page, rowsPerPage, searchTerm, statusFilter, programFilter, degreeLevelFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load stats and filter options on component mount
  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  // Handle filter changes
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleProgramFilterChange = (event) => {
    setProgramFilter(event.target.value);
    setPage(0);
  };

  const handleDegreeLevelFilterChange = (event) => {
    setDegreeLevelFilter(event.target.value);
    setPage(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProgramFilter('all');
    setDegreeLevelFilter('all');
    setPage(0);
  };

  // Refresh data
  const refreshData = () => {
    fetchApplications();
    fetchStats();
  };

  // Get status chip color
  const getStatusColor = (status) => {
    return applicationService.getStatusColor(status);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle add application success
  const handleAddApplicationSuccess = (newApplication) => {
    setSuccessMessage(`Application ${newApplication.applicationId} submitted successfully!`);
    refreshData(); // Refresh the applications list
  };

  // Handle view application
  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowViewDialog(true);
  };

  // Handle approve application
  const handleApproveApplication = async (applicationId) => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, {
        status: 'Approved',
        reviewComments: 'Application approved'
      });
      if (response.success) {
        setSuccessMessage('Application approved successfully!');
        refreshData();
      } else {
        setError(response.message || 'Failed to approve application');
      }
    } catch (error) {
      setError(error.message || 'Failed to approve application');
    }
  };

  // Handle reject application
  const handleRejectApplication = async (applicationId) => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, {
        status: 'Rejected',
        reviewComments: 'Application rejected'
      });
      if (response.success) {
        setSuccessMessage('Application rejected successfully!');
        refreshData();
      } else {
        setError(response.message || 'Failed to reject application');
      }
    } catch (error) {
      setError(error.message || 'Failed to reject application');
    }
  };

  // Handle edit application (placeholder)
  const handleEditApplication = (application) => {
    // TODO: Implement edit functionality
    console.log('Edit application:', application.applicationId);
  };

  // Handle delete application
  const handleDeleteApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      try {
        const response = await applicationService.deleteApplication(applicationId);
        if (response.success) {
          setSuccessMessage('Application deleted successfully!');
          refreshData();
        } else {
          setError(response.message || 'Failed to delete application');
        }
      } catch (error) {
        setError(error.message || 'Failed to delete application');
      }
    }
  };

  // Check if current user can manage applications (admin only for create/edit/delete)
  const canManageApplications = user && user.role === 'admin';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Assignment sx={{ mr: 2, verticalAlign: 'middle' }} />
          Admissions Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshData}
            disabled={loading}
          >
            Refresh
          </Button>
          {canManageApplications && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowAddDialog(true)}
            >
              Add Application
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assignment sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6">{stats.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Applications
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h6">{stats.byStatus['Approved'] || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h6">{stats.byStatus['Pending Review'] || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ mr: 2, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h6">{stats.recentApplications || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recent (7 days)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search applications..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {filterOptions.statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select
                value={programFilter}
                label="Program"
                onChange={handleProgramFilterChange}
              >
                <MenuItem value="all">All Programs</MenuItem>
                {filterOptions.programs.map((program) => (
                  <MenuItem key={program} value={program}>
                    {program}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Degree Level</InputLabel>
              <Select
                value={degreeLevelFilter}
                label="Degree Level"
                onChange={handleDegreeLevelFilterChange}
              >
                <MenuItem value="all">All Levels</MenuItem>
                {filterOptions.degreeLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                disabled={loading}
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Applications Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="applications table">
            <TableHead>
              <TableRow>
                <TableCell>Application ID</TableCell>
                <TableCell>Applicant Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Degree Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading applications...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary">
                      No applications found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(searchTerm || statusFilter !== 'all' || programFilter !== 'all' || degreeLevelFilter !== 'all')
                        ? 'Try adjusting your filters'
                        : 'Applications will appear here once submitted'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {application.applicationId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {`${application.personalInfo.firstName} ${application.personalInfo.lastName}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {application.personalInfo.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={application.academicInfo.program}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {application.academicInfo.degreeLevel}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={application.status}
                        size="small"
                        color={getStatusColor(application.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(application.submittedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="View details">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewApplication(application)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {(canManageApplications || user?.role === 'staff') && (
                          <>
                            <Tooltip title="Approve application">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApproveApplication(application._id)}
                                disabled={application.status === 'Approved'}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject application">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleRejectApplication(application._id)}
                                disabled={application.status === 'Rejected'}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {canManageApplications && (
                          <>
                            <Tooltip title="Edit application">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleEditApplication(application)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete application">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteApplication(application._id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
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
          count={totalApplications}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Summary Info */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {applications.length} of {totalApplications} applications
          {(searchTerm || statusFilter !== 'all' || programFilter !== 'all' || degreeLevelFilter !== 'all') && ' (filtered)'}
        </Typography>
      </Box>

      {/* Add Application Dialog */}
      <AddApplicationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddApplicationSuccess}
      />

      {/* View Application Dialog */}
      <ApplicationViewDialog
        open={showViewDialog}
        onClose={() => {
          setShowViewDialog(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
      />
    </Container>
  );
};

export default AdmissionsManagement;