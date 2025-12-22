import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { payrollService } from '../services/payrollService';
import { staffService } from '../services/staffService';

// Match Teaching Staff Directory role colors
const getRoleColor = (role) => {
  switch (role) {
    case 'professor':
      return 'primary';
    case 'ta':
      return 'secondary';
    case 'admin':
      return 'error';
    case 'staff':
      return 'info';
    default:
      return 'default';
  }
};

const formatRole = (role) => {
  switch (role) {
    case 'professor':
      return 'Professor';
    case 'ta':
      return 'Teaching Assistant';
    case 'admin':
      return 'Administrator';
    case 'staff':
      return 'Staff';
    default:
      return role;
  }
};

/* ------------------------------------------------------------------
   Admin list: ALL users with a PAYROLL action
   Route: /admin/payroll
------------------------------------------------------------------- */

export const StaffPayrollListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin =
    user?.role === 'admin' ||
    (Array.isArray(user?.roles) && user.roles.includes('admin'));

  useEffect(() => {
    const load = async () => {
      if (!isAdmin) {
        setError('Only admins can manage staff payroll.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');

    const response = await staffService.getAllStaffForPayroll();
const data = response.data || response;
const users = data.users || data.data?.users || [];
setRows(Array.isArray(users) ? users : []);

      } catch (e) {
        setError(e.message || 'Failed to load staff list');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">You are not authorized to manage payroll.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Staff Payroll Management
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'common.white' }}>Staff Member</TableCell>
                <TableCell sx={{ color: 'common.white' }}>Role</TableCell>
                <TableCell sx={{ color: 'common.white' }}>Department</TableCell>
                <TableCell sx={{ color: 'common.white' }}>Employee ID</TableCell>
                <TableCell sx={{ color: 'common.white' }}>Status</TableCell>
                <TableCell sx={{ color: 'common.white' }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => (
                <TableRow hover key={s.id}>
                  <TableCell>{s.fullName || s.name}</TableCell>

                  <TableCell>
                    <Chip
                      label={formatRole(s.role)}
                      size="small"
                      color={getRoleColor(s.role)}
                    />
                  </TableCell>

                  <TableCell>
                    {s.employeeDetails?.department || s.department || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {s.employeeDetails?.employeeId || s.employeeId || 'N/A'}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={s.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={s.isActive ? 'success' : 'default'}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/staff/${s.id}/payroll`)}
                    >
                      PAYROLL
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

/* ------------------------------------------------------------------
   Existing detail page: view / edit payroll for ONE staff member
   Route: /staff/:id/payroll
------------------------------------------------------------------- */

const StaffPayrollPage = () => {
  const { id } = useParams(); // staff id from route
  const { user } = useAuth();
  const staffId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    baseSalary: '',
    allowances: '',
    deductions: '',
    currency: 'EGP',
  });

  // history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const isAdmin =
    user?.role === 'admin' ||
    (Array.isArray(user?.roles) && user.roles.includes('admin'));
  const isSelf = user?.id === staffId;
  const canEdit = isAdmin; // only admin can edit
  const canView = isAdmin || isSelf;

  useEffect(() => {
    const loadPayroll = async () => {
      if (!canView) {
        setError('You are not authorized to view this payroll record.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');

        // latest payroll
        const data = await payrollService.getStaffPayroll(staffId);
        const payroll = data.payroll || data; // handles both shapes

        if (payroll) {
          setForm({
            baseSalary: payroll.baseSalary ?? payroll.base_salary ?? '',
            allowances: payroll.allowances ?? '',
            deductions: payroll.deductions ?? '',
            currency: payroll.currency || 'EGP',
          });
        }

        // history
        setHistoryLoading(true);
        setHistoryError('');
        const histData = await payrollService.getStaffPayrollHistory(staffId);
        const hist = histData.history || histData;
        setHistory(Array.isArray(hist) ? hist : []);
      } catch (err) {
        setError(err.message || 'Failed to load payroll information');
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    };

    loadPayroll();
  }, [staffId, canView]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!form.baseSalary || Number(form.baseSalary) <= 0) {
      setError('Base salary is required and must be greater than 0.');
      return;
    }

    try {
      setSaving(true);
      setSuccess('');
      setError('');

      await payrollService.updateStaffPayroll(staffId, {
        baseSalary: Number(form.baseSalary),
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
        currency: form.currency || 'EGP',
      });

      setSuccess('Payroll updated successfully.');

      // reload history and latest after update
      const data = await payrollService.getStaffPayroll(staffId);
      const payroll = data.payroll || data;
      if (payroll) {
        setForm({
          baseSalary: payroll.baseSalary ?? payroll.base_salary ?? '',
          allowances: payroll.allowances ?? '',
          deductions: payroll.deductions ?? '',
          currency: payroll.currency || 'EGP',
        });
      }
      const histData = await payrollService.getStaffPayrollHistory(staffId);
      const hist = histData.history || histData;
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      setError(err.message || 'Failed to update payroll');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canView) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          You are not authorized to view this payroll information.
        </Alert>
      </Container>
    );
  }

  const netSalary =
    Number(form.baseSalary || 0) +
    Number(form.allowances || 0) -
    Number(form.deductions || 0);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Payroll
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review your salary breakdown, allowances, deductions, and net pay.
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 3,
          boxShadow: 4,
          borderRadius: 2,
        }}
      >
        {/* Card header */}
        <Box
          sx={{
            mb: 3,
            pb: 1,
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Payroll Information
          </Typography>
          {isAdmin && (
            <Chip
              label="Admin view"
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mt: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 2,
            alignItems: 'flex-start',
          }}
        >
          {/* Left: form fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Base Salary"
              type="number"
              value={form.baseSalary}
              onChange={handleChange('baseSalary')}
              fullWidth
              InputProps={{ readOnly: !canEdit }}
            />
            <TextField
              label="Allowances"
              type="number"
              value={form.allowances}
              onChange={handleChange('allowances')}
              fullWidth
              InputProps={{ readOnly: !canEdit }}
            />
            <TextField
              label="Deductions"
              type="number"
              value={form.deductions}
              onChange={handleChange('deductions')}
              fullWidth
              InputProps={{ readOnly: !canEdit }}
            />
            <TextField
              label="Currency"
              value={form.currency}
              onChange={handleChange('currency')}
              fullWidth
              InputProps={{ readOnly: !canEdit }}
            />
          </Box>

          {/* Right: net salary summary */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Net Salary
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {isNaN(netSalary) ? '-' : netSalary.toFixed(2)}{' '}
              {form.currency || 'EGP'}
            </Typography>
            <Typography variant="body2">
              Base: {form.baseSalary || 0} + Allowances: {form.allowances || 0}{' '}
              − Deductions: {form.deductions || 0}
            </Typography>
          </Box>

          {canEdit && (
            <Box
              sx={{
                gridColumn: { xs: '1 / -1', md: '1 / 3' },
                textAlign: 'right',
                mt: 1,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Payroll history */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Payroll History
        </Typography>

        {historyLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {historyError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setHistoryError('')}
          >
            {historyError}
          </Alert>
        )}

        {!historyLoading && history.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No previous payroll records found.
          </Typography>
        )}

        {!historyLoading && history.length > 0 && (
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Effective from</TableCell>
                  <TableCell>Last updated</TableCell>
                  <TableCell>Updated by</TableCell>
                  <TableCell align="right">Base</TableCell>
                  <TableCell align="right">Allowances</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net</TableCell>
                  <TableCell>Currency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      {h.effectiveFrom
                        ? new Date(h.effectiveFrom).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {h.lastUpdatedAt
                        ? new Date(h.lastUpdatedAt).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell>{h.lastUpdatedBy || 'Admin'}</TableCell>
                    <TableCell align="right">{h.baseSalary}</TableCell>
                    <TableCell align="right">{h.allowances}</TableCell>
                    <TableCell align="right">{h.deductions}</TableCell>
                    <TableCell align="right">{h.netSalary}</TableCell>
                    <TableCell>{h.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default StaffPayrollPage;
