// components/Maintenance/MaintenanceDashboard.js
import React, { useState, useEffect, useCallback } from 'react'; // Add useCallback
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
  Chip,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Refresh,
  Edit,
  Visibility,
  Assignment
} from '@mui/icons-material'; // Remove Warning import
import maintenanceService from '../../services/maintenanceService'; // Fix import path
import { useAuth } from '../../context/AuthContext'; // Fix import path

const MaintenanceDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Wrap fetchData in useCallback to fix the useEffect dependency
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.priority !== 'all' && { priority: filters.priority })
      };

      const [requestsResponse, statsResponse] = await Promise.all([
        maintenanceService.getAllMaintenanceRequests(params),
        maintenanceService.getMaintenanceStats()
      ]);

      setRequests(requestsResponse.data.requests);
      setTotalRequests(requestsResponse.data.pagination.totalRequests);
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]); // Add dependencies

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [fetchData, user]); // Add fetchData to dependencies

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const getStatusChipProps = (status) => {
    const config = {
      Submitted: { color: 'primary', label: 'Submitted' },
      'In Progress': { color: 'warning', label: 'In Progress' },
      Completed: { color: 'success', label: 'Completed' },
      Cancelled: { color: 'error', label: 'Cancelled' }
    };
    return config[status] || { color: 'default', label: status };
  };

  const getPriorityChipProps = (priority) => {
    const config = {
      Low: { color: 'success', label: 'Low' },
      Medium: { color: 'warning', label: 'Medium' },
      High: { color: 'error', label: 'High' },
      Urgent: { color: 'error', label: 'Urgent', variant: 'filled' }
    };
    return config[priority] || { color: 'default', label: priority };
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = async (request, newStatus) => {
    try {
      await maintenanceService.updateMaintenanceRequestStatus(request._id, {
        status: newStatus
      });
      setStatusDialogOpen(false);
      setSelectedRequest(null);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assignment sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Maintenance Dashboard
        </Typography>
        <IconButton onClick={fetchData} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4" component="div">
                {stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed This Week
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {stats.completedThisWeek || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {stats.byStatus?.['In Progress'] || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Urgent Requests
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {stats.byPriority?.['Urgent'] || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Submitted">Submitted</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="Plumbing">Plumbing</MenuItem>
                <MenuItem value="HVAC">HVAC</MenuItem>
                <MenuItem value="Furniture">Furniture</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Structural">Structural</MenuItem>
                <MenuItem value="Cleaning">Cleaning</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Requests Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No maintenance requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.submittedBy?.firstName} {request.submittedBy?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.submittedBy?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={request.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityChipProps(request.priority).label}
                        color={getPriorityChipProps(request.priority).color}
                        size="small"
                        variant={getPriorityChipProps(request.priority).variant}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.location.building}, {request.location.roomNumber}
                        {request.location.floor && `, ${request.location.floor}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusChipProps(request.status).label}
                        color={getStatusChipProps(request.status).color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => {
                            setSelectedRequest(request);
                            setStatusDialogOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Box>
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
          count={totalRequests}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Request Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Maintenance Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedRequest.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Submitted: {formatDateTime(selectedRequest.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRequest.description}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Category</Typography>
                <Typography variant="body2">{selectedRequest.category}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Priority</Typography>
                <Chip
                  label={getPriorityChipProps(selectedRequest.priority).label}
                  color={getPriorityChipProps(selectedRequest.priority).color}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Location</Typography>
                <Typography variant="body2">
                  {selectedRequest.location.building}, Room {selectedRequest.location.roomNumber}
                  {selectedRequest.location.floor && `, ${selectedRequest.location.floor}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Submitted By</Typography>
                <Typography variant="body2">
                  {selectedRequest.submittedBy?.firstName} {selectedRequest.submittedBy?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRequest.submittedBy?.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Current Status</Typography>
                <Chip
                  label={getStatusChipProps(selectedRequest.status).label}
                  color={getStatusChipProps(selectedRequest.status).color}
                  size="small"
                />
              </Grid>
              {selectedRequest.adminNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Admin Notes</Typography>
                  <Typography variant="body2">{selectedRequest.adminNotes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Request Status</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Update status for: <strong>{selectedRequest?.title}</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
            {['Submitted', 'In Progress', 'Completed', 'Cancelled'].map(status => (
              <Button
                key={status}
                variant={selectedRequest?.status === status ? "contained" : "outlined"}
                onClick={() => handleUpdateStatus(selectedRequest, status)}
                disabled={selectedRequest?.status === status}
              >
                {status}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaintenanceDashboard;