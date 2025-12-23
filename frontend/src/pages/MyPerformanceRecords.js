// pages/MyPerformanceRecords.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import {
  TrendingUp,
  ExpandMore,
  EmojiEvents,
  Description,
  Star,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import performanceService from '../services/performanceService';
import { format } from 'date-fns';

const MyPerformanceRecords = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyPerformanceRecords();
  }, []);

  const fetchMyPerformanceRecords = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch records for current user
      const response = await performanceService.listPerformances({ userId: user.id });
      
      const recordsList = response.data?.records || [];
      setRecords(recordsList);

      // Calculate statistics
      if (recordsList.length > 0) {
        const totalEvals = recordsList.length;
        const avgScore = recordsList.reduce((sum, r) => sum + (r.score || 0), 0) / totalEvals;
        const ratingCounts = {};
        recordsList.forEach(r => {
          const rating = r.rating || 'Not Rated';
          ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        });

        setStats({
          totalEvaluations: totalEvals,
          averageScore: avgScore.toFixed(2),
          ratingCounts,
          latestEvaluation: recordsList[0]?.evaluationDate || recordsList[0]?.evaluation_date
        });
      }
    } catch (err) {
      console.error('Error fetching performance records:', err);
      setError(err.message || 'Failed to load performance records');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Outstanding':
        return 'success';
      case 'Exceeds Expectations':
        return 'primary';
      case 'Meets Expectations':
        return 'info';
      case 'Needs Improvement':
        return 'warning';
      case 'Unsatisfactory':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ mr: 1, fontSize: 36 }} />
          My Performance Records
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your performance evaluations and track your progress over time.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {records.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No Performance Records Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your performance evaluations will appear here once they are completed by your supervisor.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Statistics Cards */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Description color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h5">{stats.totalEvaluations}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Evaluations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Star color="warning" sx={{ mr: 1 }} />
                      <Typography variant="h5">{stats.averageScore}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                      <Typography variant="h5">
                        {stats.ratingCounts['Outstanding'] || 0}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding Ratings
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmojiEvents color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {formatDate(stats.latestEvaluation)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Latest Evaluation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Performance Records List */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Evaluation History
            </Typography>

            {records.map((record, index) => (
              <Accordion key={record.id} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {formatDate(record.evaluationDate || record.evaluation_date)}
                    </Typography>
                    <Chip
                      label={record.rating || 'Not Rated'}
                      color={getRatingColor(record.rating)}
                      size="small"
                    />
                    {record.score && (
                      <Chip label={`Score: ${record.score}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Comments */}
                    {record.comments && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          Evaluator Comments
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {record.comments}
                        </Typography>
                      </Grid>
                    )}

                    {/* Action Plan */}
                    {record.actionPlan || record.action_plan && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          Action Plan
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {record.actionPlan || record.action_plan}
                        </Typography>
                      </Grid>
                    )}

                    {/* Review Status */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={record.reviewed ? <CheckCircle /> : undefined}
                          label={record.reviewed ? 'Reviewed' : 'Pending Review'}
                          color={record.reviewed ? 'success' : 'default'}
                          size="small"
                        />
                        {(record.reviewDate || record.review_date) && (
                          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                            Reviewed on: {formatDate(record.reviewDate || record.review_date)}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </>
      )}
    </Container>
  );
};

export default MyPerformanceRecords;
