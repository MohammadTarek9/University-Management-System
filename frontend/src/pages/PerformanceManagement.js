import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Autocomplete
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Done } from '@mui/icons-material';
import performanceService from '../services/performanceService';
import { userService } from '../services/userService';

const ratings = [
  'Outstanding',
  'Exceeds Expectations',
  'Meets Expectations',
  'Needs Improvement',
  'Unsatisfactory'
];

const staffRoles = ['professor', 'staff', 'admin', 'ta'];

/** Normalize any record (camelCase/snake_case) into the shape this UI expects */
function normalizeRecord(r = {}) {
  const userId = r.userId ?? r.user_id ?? r.user?.id ?? null;
  const evaluatorId = r.evaluatorId ?? r.evaluator_id ?? r.evaluator?.id ?? null;

  return {
    ...r,

    id: r.id,

    userId,
    evaluatorId,

    evaluationDate: r.evaluationDate ?? r.evaluation_date ?? '',
    score: r.score ?? null,
    rating: r.rating ?? '',
    comments: r.comments ?? '',

    actionPlan: r.actionPlan ?? r.action_plan ?? '',
    reviewed: !!(r.reviewed ?? r.reviewed_flag ?? 0),

    reviewDate: r.reviewDate ?? r.review_date ?? '',
    createdBy: r.createdBy ?? r.created_by ?? null,
    createdAt: r.createdAt ?? r.created_at ?? null,
    updatedAt: r.updatedAt ?? r.updated_at ?? null
  };
}

function PerformanceForm({ open, initial, onClose, onSave }) {
  const normalizedInitial = useMemo(() => normalizeRecord(initial || {}), [initial]);

  const [form, setForm] = useState(normalizedInitial);
  const [userOptions, setUserOptions] = useState([]);
  const [evaluatorOptions, setEvaluatorOptions] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [evaluatorLoading, setEvaluatorLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [evaluatorInput, setEvaluatorInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState(null);

  // Reset form whenever we open / switch editing target
  useEffect(() => {
    setForm(normalizedInitial);
    setSelectedUser(null);
    setSelectedEvaluator(null);
    setUserInput('');
    setEvaluatorInput('');
  }, [normalizedInitial, open]);

  // Preload selected users when editing (works for camelCase or snake_case ids)
  useEffect(() => {
    let mounted = true;

    async function loadSelected() {
      if (!open) return;

      try {
        if (normalizedInitial.userId) {
          const resp = await userService.getUserById(normalizedInitial.userId);
          const u = resp.data?.user || resp.data || resp.data?.users?.[0];
          if (mounted && u) setSelectedUser(u);
        }
      } catch (_) {
        // ignore preload errors
      }

      try {
        if (normalizedInitial.evaluatorId) {
          const resp2 = await userService.getUserById(normalizedInitial.evaluatorId);
          const e = resp2.data?.user || resp2.data || resp2.data?.users?.[0];
          if (mounted && e) setSelectedEvaluator(e);
        }
      } catch (_) {
        // ignore preload errors
      }
    }

    loadSelected();
    return () => {
      mounted = false;
    };
  }, [normalizedInitial.userId, normalizedInitial.evaluatorId, open]);

  // Fetch staff options when typing (evaluated)
  useEffect(() => {
    const t = setTimeout(async () => {
      setUserLoading(true);
      try {
        const resp = await userService.getAllUsers({ search: userInput, limit: 25 });
        const list = resp.data?.users || resp.data?.users || [];
        setUserOptions(list.filter(u => staffRoles.includes(u.role)));
      } catch (_) {
        setUserOptions([]);
      } finally {
        setUserLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [userInput]);

  // Fetch evaluator options when typing
  useEffect(() => {
    const t = setTimeout(async () => {
      setEvaluatorLoading(true);
      try {
        const resp = await userService.getAllUsers({ search: evaluatorInput, limit: 25 });
        const list = resp.data?.users || resp.data?.users || [];
        setEvaluatorOptions(list.filter(u => staffRoles.includes(u.role)));
      } catch (_) {
        setEvaluatorOptions([]);
      } finally {
        setEvaluatorLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [evaluatorInput]);

  const handleChange = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{normalizedInitial?.id ? 'Edit' : 'Create'} Performance Evaluation</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Autocomplete
            options={userOptions}
            getOptionLabel={(opt) =>
              opt ? `${opt.firstName || opt.first_name} ${opt.lastName || opt.last_name} (${opt.role || opt.user_role || ''}${opt.employeeId || opt.employee_id ? ` • ${opt.employeeId || opt.employee_id}` : ''})` : ''
            }
            value={selectedUser}
            onChange={(_, v) => {
              setSelectedUser(v);
              setForm(prev => ({ ...prev, userId: v ? v.id : null }));
            }}
            onInputChange={(_, v) => setUserInput(v)}
            loading={userLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search staff (name or id)"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {userLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          <TextField
            type="date"
            label="Evaluation Date"
            value={form.evaluationDate || ''}
            onChange={handleChange('evaluationDate')}
            InputLabelProps={{ shrink: true }}
          />

          <Autocomplete
            options={evaluatorOptions}
            getOptionLabel={(opt) =>
              opt ? `${opt.firstName || opt.first_name} ${opt.lastName || opt.last_name} (${opt.role || opt.user_role || ''}${opt.employeeId || opt.employee_id ? ` • ${opt.employeeId || opt.employee_id}` : ''})` : ''
            }
            value={selectedEvaluator}
            onChange={(_, v) => {
              setSelectedEvaluator(v);
              setForm(prev => ({ ...prev, evaluatorId: v ? v.id : null }));
            }}
            onInputChange={(_, v) => setEvaluatorInput(v)}
            loading={evaluatorLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search evaluator (name or id)"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {evaluatorLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          <TextField
            label="Score (out of 10)"
            type="number"
            value={form.score ?? ''}
            onChange={handleChange('score')}
            inputProps={{ step: 0.1, min: 0, max: 10 }}
          />

          <TextField select label="Rating" value={form.rating || ''} onChange={handleChange('rating')}>
            <MenuItem value="">(none)</MenuItem>
            {ratings.map(r => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Comments" value={form.comments || ''} onChange={handleChange('comments')} multiline rows={3} />

          {normalizedInitial?.id && (
            <TextField
              label="Action Plan"
              value={form.actionPlan || ''}
              onChange={handleChange('actionPlan')}
              multiline
              rows={3}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PerformanceView({ open, record, onClose, displayUser, formatDate }) {
  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Performance Record Details</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography>
            <strong>Evaluated:</strong> {displayUser(record.userObj)}
          </Typography>
          <Typography>
            <strong>Evaluator:</strong> {displayUser(record.evaluatorObj)}
          </Typography>
          <Typography>
            <strong>Evaluation Date:</strong> {formatDate(record.evaluationDate)}
          </Typography>
          <Typography>
            <strong>Score:</strong>{' '}
            {typeof record.score !== 'undefined' && record.score !== null ? `${Number(record.score).toFixed(2)} /10` : '—'}
          </Typography>
          <Typography>
            <strong>Rating:</strong> {record.rating || '—'}
          </Typography>
          <Typography>
            <strong>Comments:</strong>
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.comments || '—'}</Typography>

          {record.actionPlan !== undefined && (
            <>
              <Typography>
                <strong>Action Plan:</strong>
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.actionPlan || '—'}</Typography>
            </>
          )}

          <Typography>
            <strong>Reviewed:</strong> {record.reviewed ? 'Yes' : 'No'}
          </Typography>
          <Typography>
            <strong>Review Date:</strong> {formatDate(record.reviewDate)}
          </Typography>
          <Typography>
            <strong>Created By:</strong> {record.createdBy || '—'}
          </Typography>
          <Typography>
            <strong>Created At:</strong> {formatDate(record.createdAt)}
          </Typography>
          <Typography>
            <strong>Updated At:</strong> {formatDate(record.updatedAt)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function PerformanceReview({ open, record, onClose, onSave }) {
  const [localReviewed, setLocalReviewed] = useState(record?.reviewed || false);
  const [localDate, setLocalDate] = useState(record?.reviewDate || record?.review_date || '');
  const [localActionPlan, setLocalActionPlan] = useState(record?.actionPlan || record?.action_plan || '');

  useEffect(() => {
    setLocalReviewed(record?.reviewed || false);
    setLocalDate(record?.reviewDate || record?.review_date || '');
    setLocalActionPlan(record?.actionPlan || record?.action_plan || '');
  }, [record]);

  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Review Performance Record</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography>
            <strong>Action Plan:</strong>
          </Typography>

          <TextField
            label="Action Plan (editable)"
            value={localActionPlan || ''}
            onChange={e => setLocalActionPlan(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={localReviewed} onChange={e => setLocalReviewed(e.target.checked)} />
              <span>Reviewed</span>
            </label>

            <TextField
              type="date"
              label="Review Date"
              value={localDate || ''}
              onChange={e => setLocalDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ id: record.id, reviewed: localReviewed, reviewDate: localDate, actionPlan: localActionPlan })}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const PerformanceManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const closeSnack = () => setSnack(prev => ({ ...prev, open: false }));

  const displayUser = (u) => {
    if (!u) return '—';
    const first = u.firstName || u.first_name || u.first || u.name || u.full_name || u.fullName || '';
    const last = u.lastName || u.last_name || u.last || '';
    const role = u.role || u.user_role || '';
    const empId = u.employeeId || u.employee_id || u.employeeDetails?.employeeId || '';
    const name = `${first} ${last}`.trim();
    if (name) {
      return empId ? `${name} (${role} • ${empId})` : `${name} (${role})`;
    }
    return empId ? `(${role} • ${empId})` : `(${role})`;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
      if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
      return d;
    } catch (_) {
      return d;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await performanceService.getAllPerformanceRecords({ limit: 50 });
      const rawRecords = res.data.records || [];

      // Normalize first (important: handles snake_case from backend)
      const records = rawRecords.map(r => normalizeRecord(r));

      // Preload user/evaluator details so UI shows name + role (no raw ids)
      const idSet = new Set();
      records.forEach(r => {
        if (r.userId) idSet.add(r.userId);
        if (r.evaluatorId) idSet.add(r.evaluatorId);
      });

      const ids = Array.from(idSet);
      const usersMap = {};

      await Promise.all(
        ids.map(async (id) => {
          try {
            const ur = await userService.getUserById(id);
            const u = ur.data?.user || ur.data || ur.data?.users?.[0];
            if (u) usersMap[id] = u;
          } catch (_) {
            // ignore individual lookup errors
          }
        })
      );

      const mapped = records.map(r => ({
        ...r,
        userObj: usersMap[r.userId] || r.userObj || null,
        evaluatorObj: usersMap[r.evaluatorId] || r.evaluatorObj || null
      }));

      setRows(mapped);
    } catch (err) {
      console.error(err);
      showSnack(err?.response?.data?.message || err?.message || 'Failed to load performance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (row) => {
    setEditing(row); // already normalized in rows
    setDialogOpen(true);
  };

  const handleView = (r) => {
    setViewRecord(r);
    setViewOpen(true);
  };

  const handleOpenReview = (r) => {
    setReviewRecord(r);
    setReviewOpen(true);
  };

  const openDeleteDialog = (r) => {
    setDeleteRecord(r);
    setDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteOpen(false);
    setDeleteRecord(null);
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return closeDeleteDialog();

    try {
      await performanceService.deletePerformanceRecord(deleteRecord.id);
      showSnack('Performance record deleted', 'success');
      closeDeleteDialog();
      fetchData();
    } catch (err) {
      console.error(err);
      showSnack(err?.response?.data?.message || err?.message || 'Failed to delete record', 'error');
    }
  };


  const handleSave = async (data) => {
    try {
      const normalized = normalizeRecord(data);

      // Clamp score
      let score = normalized.score;
      if (score !== undefined && score !== null && score !== '') {
        const n = parseFloat(score);
        score = Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : null;
      } else {
        score = null;
      }

      // Send payload using camelCase to satisfy route validators and repo
      const apiPayload = {
        userId: normalized.userId ?? null,
        evaluatorId: normalized.evaluatorId ?? null,
        evaluationDate: normalized.evaluationDate || null,
        score,
        rating: normalized.rating || null,
        comments: normalized.comments || null
      };

      // Only include actionPlan when editing (your UI only shows it then)
      if (editing && editing.id) {
        apiPayload.actionPlan = normalized.actionPlan ?? null;
      }

      if (editing && editing.id) {
        await performanceService.updatePerformanceRecord(editing.id, apiPayload);
        showSnack('Performance record updated', 'success');
      } else {
        await performanceService.createPerformanceRecord(apiPayload);
        showSnack('Performance record created', 'success');
      }

      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showSnack(err?.response?.data?.message || err?.message || 'Save failed', 'error');
      // keep dialog open so user can fix inputs
    }
  };

  const handleSaveReview = async ({ id, reviewed, reviewDate, actionPlan } = {}) => {
    try {
      const payload = {};

      if (typeof reviewed !== 'undefined') payload.reviewed = !!reviewed;
      if (reviewDate) payload.reviewDate = reviewDate;
      if (actionPlan !== undefined) payload.actionPlan = actionPlan;

      await performanceService.updatePerformanceRecord(id, payload);
      setReviewOpen(false);
      fetchData();
      showSnack('Performance record reviewed', 'success');
    } catch (err) {
      console.error(err);
      showSnack(err?.response?.data?.message || err?.message || 'Failed to save review', 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PerformanceView
        open={viewOpen}
        record={viewRecord}
        onClose={() => setViewOpen(false)}
        displayUser={displayUser}
        formatDate={formatDate}
      />

      <PerformanceReview
        open={reviewOpen}
        record={reviewRecord}
        onClose={() => setReviewOpen(false)}
        onSave={handleSaveReview}
      />

      <Dialog open={deleteOpen} onClose={closeDeleteDialog} fullWidth>
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the performance record for "{displayUser(deleteRecord?.userObj)}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Performance Records</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          New
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Evaluated</TableCell>
                <TableCell>Evaluator</TableCell>
                <TableCell>Evaluation Date</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{displayUser(r.userObj)}</TableCell>
                  <TableCell>{displayUser(r.evaluatorObj)}</TableCell>
                  <TableCell>{formatDate(r.evaluationDate)}</TableCell>
                  <TableCell>
                    {typeof r.score !== 'undefined' && r.score !== null ? `${Number(r.score).toFixed(2)} /10` : '—'}
                  </TableCell>
                  <TableCell>{r.rating}</TableCell>
                  <TableCell>
                    <IconButton color="info" onClick={() => handleView(r)}>
                      <Visibility />
                    </IconButton>
                    <IconButton color="success" onClick={() => handleOpenReview(r)}>
                      <Done />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleEdit(r)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => openDeleteDialog(r)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <PerformanceForm
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Container>
  );
};

export default PerformanceManagement;
