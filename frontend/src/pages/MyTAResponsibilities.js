import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { staffService } from '../services/staffService';

const MyTAResponsibilities = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await staffService.getMyResponsibilities();
        const payload = res.data || res;
        const data = payload.data || [];

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load responsibilities.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <Container maxWidth={false} sx={{ maxWidth: '1400px' }}>

      <Box mt={4} mb={3}>
        <Typography variant="h4" gutterBottom>
          My TA Responsibilities
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage the courses and tasks assigned to you.
        </Typography>
      </Box>

      {error && (
        <Box mb={2}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="textSecondary">
          You do not have any assigned responsibilities yet.
        </Typography>
                 ) : (
        <Paper
          sx={{
            width: '100%',
            mt: 2,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: 900,
              '& thead th': {
                backgroundColor: 'grey.100',
                fontWeight: 600,
                fontSize: 26,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              },
              '& tbody tr:nth-of-type(odd)': {
                backgroundColor: 'grey.50',
              },
              '& tbody tr:hover': {
                backgroundColor: 'grey.100',
              },
              '& tbody td': {
                 fontSize: 22,          // body font size
                  },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Responsibility</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Assigned On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{row.course_name}</TableCell>
                  <TableCell>{row.responsibility_type}</TableCell>
                  <TableCell sx={{ maxWidth: 600 }}>
                    <Typography variant="body1" color="text.primary">
                      {row.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString()
                      : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}


    </Container>
  );
};

export default MyTAResponsibilities;
