import React, { useState } from 'react';
import {
  Box, Card, Typography, Grid, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function HRSalaryPayments() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { data: records, isLoading } = useQuery({
    queryKey: ['salary-register', month, year],
    queryFn: () => salaryApi.getMonthlyRegister(month, year).then(r => r.data),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => salaryApi.markAsPaid(id),
    onSuccess: () => {
      toast.success('Payment marked successfully and employee notified!');
      queryClient.invalidateQueries({ queryKey: ['salary-register'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to process payment');
    }
  });

  const handlePay = (id: number) => {
    if (window.confirm('Are you sure you want to mark this salary as PAID? This will notify the employee.')) {
      payMutation.mutate(id);
    }
  };

  const pendingRecords = records?.filter((r: any) => r.payment_status !== 'paid') || [];
  const paidRecords = records?.filter((r: any) => r.payment_status === 'paid') || [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
          Monthly Payroll & Payments
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          View monthly salary register and execute payments.
        </Typography>
      </Box>

      <Card sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Select Month"
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
        </Grid>
      </Card>

      {isLoading ? (
        <CircularProgress />
      ) : records?.length === 0 ? (
        <Alert severity="info">No salary records found for {month}/{year}. Use the Salary Dispatcher to generate salaries first.</Alert>
      ) : (
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 2 }}>
            <Chip label={`Total Records: ${records.length}`} color="primary" variant="outlined" />
            <Chip label={`Pending Payments: ${pendingRecords.length}`} color="warning" />
            <Chip label={`Paid: ${paidRecords.length}`} color="success" />
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>Net Payable</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((row: any) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{row.employee_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.employee_code}</Typography>
                    </TableCell>
                    <TableCell>₹{row.gross_salary?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="primary.main">
                        ₹{row.net_salary?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.payment_status?.toUpperCase()}
                        size="small"
                        color={row.payment_status === 'paid' ? 'success' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{row.payment_date || '-'}</TableCell>
                    <TableCell align="right">
                      {row.payment_status !== 'paid' ? (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          disabled={payMutation.isPending}
                          onClick={() => handlePay(row.id)}
                        >
                          Make Payment
                        </Button>
                      ) : (
                        <Button variant="outlined" size="small" disabled>
                          Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
