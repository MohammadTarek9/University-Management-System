import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { researchService } from '../services/researchService';
import { useAuth } from '../context/AuthContext';

const ResearchList = ({ isUserOwn = true, refreshTrigger, onEdit = null }) => {
  const { user } = useAuth();
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState('');

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    fetchResearch(abortControllerRef.current.signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, statusFilter, refreshTrigger, isUserOwn]);

  const fetchResearch = async (signal) => {
    try {
      setLoading(true);
      setError('');

      let response;
      if (isUserOwn) {
        // Get user's own research
        response = await researchService.getUserResearch({
          status: statusFilter,
          page,
          limit: pageSize
        });
      } else {
        // Get published research by user (for profile view)
        response = await researchService.getPublishedResearchByUser(user?.id, {
          page,
          limit: pageSize
        });
      }

      if (signal && signal.aborted) {
        return;
      }

      const researchData = response.research || [];
      const pagination = response.pagination || {};

      setResearch(Array.isArray(researchData) ? researchData : []);
      setTotalPages(pagination.totalPages || pagination.pages || 1);
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        return;
      }

      const errorMessage = err?.message || 'Failed to load research';
      setError(errorMessage);
      console.error('Fetch research error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (researchId) => {
    if (window.confirm('Are you sure you want to delete this research?')) {
      try {
        setLoading(true);
        await researchService.deleteResearch(researchId);
        setSuccess('Research archived successfully');
        setPage(1);
        fetchResearch();
      } catch (err) {
        setError(err.message || 'Failed to delete research');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      published: 'success',
      draft: 'warning',
      archived: 'error'
    };
    return colorMap[status] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && research.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        {isUserOwn ? 'My Research Outputs' : 'Published Research'}
      </Typography>

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

      {/* Filter */}
      {isUserOwn && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              label="Filter by Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Research Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {research.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              {isUserOwn ? 'No research outputs published yet' : 'No published research found'}
            </Typography>
          </Grid>
        ) : (
          research.map(r => (
            <Grid item xs={12} sm={6} md={4} key={r.research_id}>
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
                  <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 2 }}>
                    {r.title}
                  </Typography>

                  {/* Research Type & Status */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={r.research_type}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    {isUserOwn && (
                      <Chip
                        label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        size="small"
                        color={getStatusColor(r.status)}
                      />
                    )}
                  </Box>

                  {/* Publication Date */}
                  {r.publication_date && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Published:</strong> {formatDate(r.publication_date)}
                    </Typography>
                  )}

                  {/* Journal/Conference */}
                  {(r.journal_name || r.conference_name) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>
                        {r.journal_name ? 'Journal' : 'Conference'}:
                      </strong>{' '}
                      {r.journal_name || r.conference_name}
                    </Typography>
                  )}

                  {/* Keywords */}
                  {r.keywords && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Keywords:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {r.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                          <Chip
                            key={idx}
                            label={keyword.trim()}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Abstract Preview */}
                  {r.abstract && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                      {r.abstract.substring(0, 150)}
                      {r.abstract.length > 150 ? '...' : ''}
                    </Typography>
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ pt: 0 }}>
                  {isUserOwn ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => onEdit && onEdit(r)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(r.research_id)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      href={r.url}
                      target="_blank"
                      disabled={!r.url}
                    >
                      View
                    </Button>
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
  );
};

export default ResearchList;