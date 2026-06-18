import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Tooltip, alpha, Skeleton,
  Tab, Tabs, Grid, LinearProgress
} from '@mui/material';
import {
  Download, CloudDownload, FileDownload, CheckCircle, Cancel,
  AccessTime, Add, Filter, Search
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { SalaryRecord } from '../../types';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SalaryPage() {
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const queryClient = useQueryClient();

  const selectedYear = new Date().getFullYear();

  const { data: slips, isLoading } = useQuery({
    queryKey: ['salary-slips', selectedYear],
    queryFn: () => salaryApi.getSlips({ year: selectedYear }).then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['salary-summary'],
    queryFn: () => salaryApi.getSummary().then((r) => r.data),
  });



  const totalNet = slips?.reduce((sum: number, s: SalaryRecord) => sum + s.net_salary, 0) || 0;
  const avgNet = slips?.length ? totalNet / slips.length : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Salary Slips</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            View your monthly salary statements for the current year
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Latest Salary',
            value: summary?.latest_salary
              ? `₹${summary.latest_salary.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : 'N/A',
            sub: summary?.latest_salary ? `${summary.latest_salary.month_name} ${summary.latest_salary.year}` : '',
            color: '#2E7D32', icon: '💰'
          },
          {
            label: `${selectedYear} Average`,
            value: avgNet > 0 ? `₹${avgNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A',
            sub: 'Net salary per month',
            color: '#1565C0', icon: '📊'
          },
          {
            label: `${selectedYear} Total`,
            value: totalNet > 0 ? `₹${totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'N/A',
            sub: `${slips?.length || 0} months`,
            color: '#6A1B9A', icon: '💎'
          },
          {
            label: 'Total Records',
            value: summary?.total_records || 0,
            sub: 'All salary slips',
            color: '#E65100', icon: '📄'
          },
        ].map((stat, i) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card sx={{ border: `1px solid ${alpha(stat.color, 0.2)}` }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h4" sx={{ mb: 0.25 }}>{stat.icon}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: stat.color, my: 0.25 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{stat.sub}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Salary Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography variant="h6" fontWeight={700}>
              {selectedYear} Salary Records
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Basic</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Gross</TableCell>
                  <TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : slips?.length > 0 ? (
                  slips.map((slip: SalaryRecord) => (
                    <TableRow key={slip.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {MONTH_NAMES[slip.month]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{slip.year}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2">
                          ₹{slip.basic_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{slip.gross_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: '#C62828' }}>
                          ₹{slip.total_deductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} sx={{ color: '#2E7D32' }}>
                          ₹{slip.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={slip.payment_status}
                          color={slip.payment_status === 'paid' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary">
                        No salary records found for {selectedYear}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        To download salary slips, please ask the AI Assistant.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>


    </Box>
  );
}
