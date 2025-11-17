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
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { researchService } from '../services/researchService';

const PublicResearchList = () => {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  const [researchTypeFilter, setResearchTypeFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

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
  }, [page, researchTypeFilter, searchKeyword]);

  const fetchResearch = async (signal) => {
    try {
      setLoading(true);
      setError('');

      const response = await researchService.getAllPublishedResearch({
        page,
        limit: pageSize,
        researchType: researchTypeFilter,
        keyword: searchKeyword
      });

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

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
    setPage(1);
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
        Published Research Outputs
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {/* Search Bar */}
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, keywords, or abstract"
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

          {/* Research Type Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Research Type</InputLabel>
              <Select
                value={researchTypeFilter}
                onChange={(e) => {
                  setResearchTypeFilter(e.target.value);
                  setPage(1);
                }}
                label="Research Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="Paper">Paper</MenuItem>
                <MenuItem value="Article">Article</MenuItem>
                <MenuItem value="Book">Book</MenuItem>
                <MenuItem value="Conference">Conference</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Filters */}
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setResearchTypeFilter('');
                setSearchKeyword('');
                setSearchInput('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Research Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {research.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No published research found
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

                  {/* Author */}
                  <Typography variant="body2" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                    By: {r.first_name} {r.last_name}
                  </Typography>

                  {/* Research Type */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={r.research_type}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
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

                  {/* DOI */}
                  {r.doi && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>DOI:</strong> {r.doi}
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
                      {r.abstract.substring(0, 120)}
                      {r.abstract.length > 120 ? '...' : ''}
                    </Typography>
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ pt: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    href={r.url}
                    target="_blank"
                    disabled={!r.url}
                    fullWidth
                  >
                    {r.url ? 'View Full Research' : 'No Link Available'}
                  </Button>
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

export default PublicResearchList;