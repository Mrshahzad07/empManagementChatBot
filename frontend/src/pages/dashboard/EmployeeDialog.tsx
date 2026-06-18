import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, MenuItem, CircularProgress, Box
} from '@mui/material';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  employeeId?: number | null;
}

export default function EmployeeDialog({ open, onClose, mode, employeeId }: EmployeeDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    department_id: '',
    designation: '',
    role_id: 1,
  });

  useEffect(() => {
    if (open) {
      adminApi.getDepartments().then(r => setDepartments(r.data)).catch(console.error);
      
      if ((mode === 'edit' || mode === 'view') && employeeId) {
        setLoading(true);
        adminApi.getEmployee(employeeId)
          .then(r => {
            const emp = r.data;
            setFormData({
              employee_id: emp.employee_id || '',
              email: emp.email || '',
              password: '', // won't show password on edit
              first_name: emp.first_name || '',
              last_name: emp.last_name || '',
              department_id: emp.department?.id || '',
              designation: emp.designation || '',
              role_id: emp.role?.id || 1,
            });
          })
          .catch(() => toast.error('Failed to load employee details'))
          .finally(() => setLoading(false));
      } else {
        setFormData({
          employee_id: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          department_id: '',
          designation: '',
          role_id: 1,
        });
      }
    }
  }, [open, mode, employeeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === 'add') {
        await adminApi.createEmployee(formData);
        toast.success('Employee created successfully');
      } else if (mode === 'edit' && employeeId) {
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          designation: formData.designation,
          department_id: formData.department_id || null,
        };
        await adminApi.updateEmployee(employeeId, updateData);
        toast.success('Employee updated successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isView = mode === 'view';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Employee' : mode === 'edit' ? 'Edit Employee' : 'View Employee'}
      </DialogTitle>
      <DialogContent dividers>
        {loading && mode !== 'add' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {mode === 'add' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Employee ID" name="employee_id" value={formData.employee_id} onChange={handleChange} disabled={isView} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isView} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} disabled={isView} required />
                </Grid>
              </>
            )}
            
            {mode !== 'add' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Employee ID" value={formData.employee_id} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" value={formData.email} disabled />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} disabled={isView} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} disabled={isView} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Designation" name="designation" value={formData.designation} onChange={handleChange} disabled={isView} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select 
                fullWidth 
                label="Department" 
                name="department_id" 
                value={formData.department_id} 
                onChange={handleChange} 
                disabled={isView}
              >
                <MenuItem value="">None</MenuItem>
                {departments.map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>Close</Button>
        {!isView && (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
