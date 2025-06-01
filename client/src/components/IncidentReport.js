import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  useTheme,
} from '@mui/material';
import axios from 'axios';

const incidentTypes = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'theft', label: 'Theft' },
  { value: 'poor_lighting', label: 'Poor Lighting' },
  { value: 'unsafe_area', label: 'Generally Unsafe Area' },
  { value: 'other', label: 'Other' },
];

const IncidentReport = ({ open, onClose, location }) => {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const theme = useTheme();

  const handleSubmit = async (e) => {
    if (!location) return;
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      await axios.post('http://localhost:5000/api/incidents', {
        type,
        description,
        severity,
        location: {
          type: 'Point',
          coordinates: location,
        },
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('');
    setDescription('');
    setSeverity(3);
    setError(null);
    setSuccess(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: '#eef2f7',
          fontWeight: 600,
          fontSize: '1.5rem',
          color: '#444',
          paddingBottom: 1,
        }}
      >
        Report an Incident
      </DialogTitle>

      <DialogContent sx={{ background: '#f9fbfd', py: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          Please provide details about the incident you've witnessed or experienced.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Report submitted successfully!</Alert>}

          <FormControl fullWidth>
            <InputLabel>Incident Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={submitting}
              sx={{ backgroundColor: '#fff' }}
            >
              {incidentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder="Describe what happened..."
            sx={{ backgroundColor: '#fff' }}
          />

          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              disabled={submitting}
              sx={{ backgroundColor: '#fff' }}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <MenuItem key={value} value={value}>
                  {value} – {value === 1 ? 'Minor' : value === 5 ? 'Severe' : `Level ${value}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ background: '#eef2f7', px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !type || !description}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncidentReport;
