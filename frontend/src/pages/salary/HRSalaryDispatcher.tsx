import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  MenuItem, Divider, CircularProgress, Alert, Chip
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi, salaryApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function HRSalaryDispatcher() {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // Earnings
  const [basic, setBasic] = useState<string>('');
  const [hra, setHra] = useState<string>('');
  const [transport, setTransport] = useState<string>('0');
  const [medical, setMedical] = useState<string>('0');
  const [special, setSpecial] = useState<string>('0');
  const [other, setOther] = useState<string>('0');
  const [bonus, setBonus] = useState<string>('0');

  // Deductions
  const [pf, setPf] = useState<string>('0');
  const [esi, setEsi] = useState<string>('0');
  const [tds, setTds] = useState<string>('0');
  const [pt, setPt] = useState<string>('0');
  const [loan, setLoan] = useState<string>('0');

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: () => adminApi.getEmployees().then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (records: any[]) => salaryApi.upload(records),
    onSuccess: () => {
      toast.success('Salary dispatched successfully! Slip generated.');
      setBasic(''); setHra(''); setTransport('0'); setMedical('0');
      setSpecial('0'); setOther('0'); setBonus('0'); setPf('0');
      setEsi('0'); setTds('0'); setPt('0'); setLoan('0');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to dispatch salary');
    }
  });

  const handleDispatch = () => {
    if (!employeeId || !basic) {
      toast.error('Please select an employee and enter Basic Salary');
      return;
    }

    const record = {
      employee_id: employeeId,
      month,
      year,
      basic_salary: parseFloat(basic),
      hra: parseFloat(hra || '0'),
      transport_allowance: parseFloat(transport || '0'),
      medical_allowance: parseFloat(medical || '0'),
      special_allowance: parseFloat(special || '0'),
      other_allowances: parseFloat(other || '0'),
      bonus: parseFloat(bonus || '0'),
      pf_deduction: parseFloat(pf || '0'),
      esi_deduction: parseFloat(esi || '0'),
      tds_deduction: parseFloat(tds || '0'),
      professional_tax: parseFloat(pt || '0'),
      loan_deduction: parseFloat(loan || '0'),
    };

    uploadMutation.mutate([record]);
  };

  const handleCalculateHraPf = () => {
    if (basic && !isNaN(parseFloat(basic))) {
      const b = parseFloat(basic);
      setHra((b * 0.4).toFixed(0)); // Standard 40% HRA
      setPf((b * 0.12).toFixed(0)); // Standard 12% PF
      toast.success('HRA and PF auto-calculated based on Basic!');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
          Salary Dispatcher
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Dispatch salary records and automatically generate PDF payslips for employees
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
            Once you click Dispatch, the AI system will generate a professional PDF salary slip, store it in the employee's vault, and send them a notification instantly.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Select Employee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={employeesLoading}
              >
                {employees ? employees.map((emp: any) => (
                  <MenuItem key={emp.employee_id} value={emp.employee_id}>
                    {emp.full_name} ({emp.employee_id})
                  </MenuItem>
                )) : <MenuItem value="" disabled>Loading...</MenuItem>}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Earnings" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Basic Salary (₹) *"
                type="number"
                value={basic}
                onChange={(e) => setBasic(e.target.value)}
              />
              <Button size="small" onClick={handleCalculateHraPf} sx={{ mt: 1 }}>
                Auto-Calculate HRA & PF
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="HRA (₹)"
                type="number"
                value={hra}
                onChange={(e) => setHra(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Transport (₹)" type="number" value={transport} onChange={(e) => setTransport(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Medical (₹)" type="number" value={medical} onChange={(e) => setMedical(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Special (₹)" type="number" value={special} onChange={(e) => setSpecial(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Other Allowances (₹)" type="number" value={other} onChange={(e) => setOther(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Bonus (₹)" type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Deductions" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField fullWidth label="PF Deduction (₹)" type="number" value={pf} onChange={(e) => setPf(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="ESI Deduction (₹)" type="number" value={esi} onChange={(e) => setEsi(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="TDS (Tax) (₹)" type="number" value={tds} onChange={(e) => setTds(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Professional Tax (₹)" type="number" value={pt} onChange={(e) => setPt(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Loan Deduction (₹)" type="number" value={loan} onChange={(e) => setLoan(e.target.value)} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDispatch}
                disabled={uploadMutation.isPending}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                  '&:hover': { background: 'linear-gradient(135deg, #1B5E20, #000000)' },
                }}
              >
                {uploadMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Dispatch Salary & Generate Slip'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
