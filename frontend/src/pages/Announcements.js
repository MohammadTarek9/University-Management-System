import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Search, Close, Add } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { announcementsService } from '../services/announcementsService';
import AnnouncementForm from '../pages/AnnouncementForm';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const abortControllerRef = useRef(null);

  const canManageAnnouncements = ['admin', 'staff', 'professor'].includes(user?.role);

  // Check if user can delete a specific announcement
  const canDeleteAnnouncement = (announcement) => {
    if (!user) return false;
    return user.role === 'admin' || announcement.author_id === user.id;
  };

  // Check if user can edit a specific announcement
  const canEditAnnouncement = (announcement) => {
    if (!user) return false;
    return user.role === 'admin' || announcement.author_id === user.id;
  };

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    fetchAnnouncements(abortControllerRef.current.signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, categoryFilter, searchKeyword]);

  const fetchAnnouncements = async (signal) => {
    try {
      setLoading(true);
      setError('');

      const response = await announcementsService.getAnnouncements({
        page,
        limit: pageSize,
        category: categoryFilter,
        searchQuery: searchKeyword
      });

      if (signal && signal.aborted) {
        return;
      }

      const announcementsData = response.announcements || [];
      const pagination = response.pagination || {};

      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      setTotalPages(pagination.totalPages || pagination.pages || 1);
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        return;
      }

      const errorMessage = err?.message || 'Failed to load announcements';
      setError(errorMessage);
      console.error('Fetch announcements error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
    setPage(1);
  };

  const handleViewDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailsOpen(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormOpen(true);
  };

  const handleDelete = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementsService.deleteAnnouncement(announcementId);
        setSuccess('Announcement deleted successfully');
        fetchAnnouncements();
      } catch (err) {
        setError(err.message || 'Failed to delete announcement');
      }
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingAnnouncement(null);
    setSuccess(editingAnnouncement ? 'Announcement updated successfully' : 'Announcement created successfully');
    fetchAnnouncements();
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      general: 'default',
      academic: 'primary',
      administrative: 'secondary',
      facilities: 'info',
      events: 'success',
      urgent: 'error'
    };
    return colorMap[category] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      low: 'default',
      normal: 'info',
      high: 'error'
    };
    return colorMap[priority] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && announcements.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          University Announcements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay informed about important updates, events, and university activities
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* Action Button and Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {canManageAnnouncements && (
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setFormOpen(true);
                  }}
                >
                  Create Announcement
                </Button>
              </Grid>
            )}

            {/* Search Bar */}
            <Grid item xs={12} md={canManageAnnouncements ? 5 : 6}>
              <form onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search announcements..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <Button type="submit" variant="contained" size="small">
                        Search
                      </Button>
                    )
                  }}
                />
              </form>
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} md={canManageAnnouncements ? 3 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="administrative">Administrative</MenuItem>
                  <MenuItem value="facilities">Facilities</MenuItem>
                  <MenuItem value="events">Events</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Clear Filters */}
            <Grid item xs={12} md={canManageAnnouncements ? 1 : 2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setCategoryFilter('');
                  setSearchKeyword('');
                  setSearchInput('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Announcements Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {announcements.length === 0 ? (
            <Grid item xs={12}>
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No announcements found
              </Typography>
            </Grid>
          ) : (
            announcements.map(announcement => (
              <Grid item xs={12} sm={6} md={4} key={announcement.announcement_id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Title */}
                    <Typography variant="h6" component="h3" gutterBottom>
                      {announcement.title}
                    </Typography>

                    {/* Category and Priority */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={announcement.category}
                        size="small"
                        color={getCategoryColor(announcement.category)}
                      />
                      <Chip
                        label={announcement.priority}
                        size="small"
                        variant="outlined"
                        color={getPriorityColor(announcement.priority)}
                      />
                    </Box>

                    {/* Content Preview */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {announcement.content.substring(0, 150)}
                      {announcement.content.length > 150 ? '...' : ''}
                    </Typography>

                    {/* Author and Date */}
                    <Typography variant="caption" color="text.secondary">
                      By: {announcement.first_name} {announcement.last_name}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(announcement.published_date)}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(announcement)}
                    >
                      View Details
                    </Button>
                    {(canEditAnnouncement(announcement) || canDeleteAnnouncement(announcement)) && (
                      <Box>
                        {canEditAnnouncement(announcement) && (
                          <Button
                            size="small"
                            onClick={() => handleEdit(announcement)}
                          >
                            Edit
                          </Button>
                        )}
                        {canDeleteAnnouncement(announcement) && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDelete(announcement.announcement_id)}
                          >
                            Delete
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Announcement Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedAnnouncement?.title}</Typography>
            <IconButton onClick={() => setDetailsOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAnnouncement && (
            <>
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedAnnouncement.category}
                  size="small"
                  color={getCategoryColor(selectedAnnouncement.category)}
                />
                <Chip
                  label={selectedAnnouncement.priority}
                  size="small"
                  variant="outlined"
                  color={getPriorityColor(selectedAnnouncement.priority)}
                />
                <Chip
                  label={`For: ${selectedAnnouncement.target_audience}`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedAnnouncement.content}
              </Typography>

              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Posted by: {selectedAnnouncement.first_name} {selectedAnnouncement.last_name}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Published: {formatDate(selectedAnnouncement.published_date)}
                </Typography>
                {selectedAnnouncement.expiry_date && (
                  <>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Expires: {formatDate(selectedAnnouncement.expiry_date)}
                    </Typography>
                  </>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Announcement Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAnnouncement(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent>
          <AnnouncementForm
            editingAnnouncement={editingAnnouncement}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false);
              setEditingAnnouncement(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Announcements;