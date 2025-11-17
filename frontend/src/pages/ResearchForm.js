import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import { researchService } from '../services/researchService';
import { useAuth } from '../context/AuthContext';

const ResearchForm = ({ onSubmitSuccess, editingResearch = null }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    researchType: 'Paper',
    publicationDate: '',
    journalName: '',
    conferenceName: '',
    doi: '',
    keywords: '',
    abstract: '',
    url: '',
    status: 'published'
  });

  // Load editing data if provided
  useEffect(() => {
    if (editingResearch) {
      setFormData({
        title: editingResearch.title || '',
        description: editingResearch.description || '',
        researchType: editingResearch.research_type || 'Paper',
        publicationDate: editingResearch.publication_date || '',
        journalName: editingResearch.journal_name || '',
        conferenceName: editingResearch.conference_name || '',
        doi: editingResearch.doi || '',
        keywords: editingResearch.keywords || '',
        abstract: editingResearch.abstract || '',
        url: editingResearch.url || '',
        status: editingResearch.status || 'published'
      });
    }
  }, [editingResearch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (!formData.researchType) {
      setError('Research type is required');
      return;
    }

    // Validate DOI format if provided
    if (formData.doi && formData.doi.trim() && !formData.doi.match(/^10\.\d+\/[^\s]+$/)) {
      setError('Invalid DOI format (e.g., 10.1234/example)');
      return;
    }

    // Validate URL if provided - FIXED: Check if URL is not empty before validating
    if (formData.url && formData.url.trim() && !formData.url.match(/^https?:\/\/.+/)) {
      setError('URL must start with http:// or https://');
      return;
    }

    // Validate publication date if provided
    if (formData.publicationDate) {
      const pubDate = new Date(formData.publicationDate);
      const today = new Date();
      if (pubDate > today) {
        setError('Publication date cannot be in the future');
        return;
      }
    }

    if (formData.abstract && formData.abstract.length > 2000) {
      setError('Abstract must not exceed 2000 characters');
      return;
    }

    try {
      setLoading(true);

      if (editingResearch) {
        // Update existing research
        await researchService.updateResearch(editingResearch.research_id, formData);
        setSuccess('Research updated successfully!');
      } else {
        // Create new research
        await researchService.createResearch(formData);
        setSuccess('Research published successfully!');
      }

      // Reset form if creating new
      if (!editingResearch) {
        setFormData({
          title: '',
          description: '',
          researchType: 'Paper',
          publicationDate: '',
          journalName: '',
          conferenceName: '',
          doi: '',
          keywords: '',
          abstract: '',
          url: '',
          status: 'published'
        });
      }

      // Call callback if provided
      if (onSubmitSuccess) {
        setTimeout(onSubmitSuccess, 1500);
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to save research';
      setError(errorMessage);
      console.error('Error saving research:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        {editingResearch ? 'Edit Research' : 'Publish Research Output'}
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

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Research paper title"
              helperText={`${formData.title.length}/255 characters`}
              required
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              placeholder="Brief description of your research"
            />
          </Grid>

          {/* Research Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Research Type</InputLabel>
              <Select
                name="researchType"
                value={formData.researchType}
                onChange={handleInputChange}
                label="Research Type"
              >
                <MenuItem value="Paper">Paper</MenuItem>
                <MenuItem value="Article">Article</MenuItem>
                <MenuItem value="Book">Book</MenuItem>
                <MenuItem value="Conference">Conference</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Publication Date - HTML5 Input*/}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Publication Date"
              name="publicationDate"
              value={formData.publicationDate}
              onChange={handleInputChange}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          {/* Journal Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Journal/Publication Name"
              name="journalName"
              value={formData.journalName}
              onChange={handleInputChange}
              placeholder="e.g., Nature, IEEE, etc."
            />
          </Grid>

          {/* Conference Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Conference Name"
              name="conferenceName"
              value={formData.conferenceName}
              onChange={handleInputChange}
              placeholder="e.g., ICML, CVPR, etc."
            />
          </Grid>

          {/* DOI */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="DOI"
              name="doi"
              value={formData.doi}
              onChange={handleInputChange}
              placeholder="10.xxxx/xxxxx"
              helperText="Digital Object Identifier (optional)"
            />
          </Grid>

          {/* Keywords */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="Comma-separated keywords"
              helperText="e.g., machine learning, AI, deep learning"
            />
          </Grid>

          {/* Abstract */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Abstract"
              name="abstract"
              value={formData.abstract}
              onChange={handleInputChange}
              multiline
              rows={4}
              placeholder="Summary of your research"
              helperText={`${formData.abstract.length}/2000 characters`}
            />
          </Grid>

          {/* URL */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Research URL"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com/research"
              helperText="Link to published research (optional)"
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Status
            </Typography>
            <RadioGroup
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              row
            >
              <FormControlLabel
                value="draft"
                control={<Radio />}
                label="Draft (Private)"
              />
              <FormControlLabel
                value="published"
                control={<Radio />}
                label="Published (Public)"
              />
              <FormControlLabel
                value="archived"
                control={<Radio />}
                label="Archived"
              />
            </RadioGroup>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : editingResearch ? 'Update Research' : 'Publish Research'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ResearchForm;