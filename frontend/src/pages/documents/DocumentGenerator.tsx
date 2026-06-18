import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  MenuItem, Select, InputLabel, FormControl, Grid, CircularProgress,
  Divider, Paper
} from '@mui/material';
import { Description, Download, CloudUpload, AutoAwesome } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminApi, documentsApi } from '../../services/api';
import toast from 'react-hot-toast';

const DOCUMENT_TYPES = [
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'relieving_letter', label: 'Relieving Letter' },
  { value: 'termination_letter', label: 'Termination Letter' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];

export default function DocumentGenerator() {
  const [docType, setDocType] = useState('offer_letter');
  const [docName, setDocName] = useState('Offer Letter');
  const [requirements, setRequirements] = useState('');
  const [ctc, setCtc] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ['admin-employees-all'],
    queryFn: () => adminApi.getEmployees({ limit: 1000 }).then(r => r.data),
  });

  const handleGenerate = async () => {
    if (!docType || !requirements) {
      toast.error('Please select a document type and provide requirements.');
      return;
    }
    
    let empDetails = {};
    if (employeeId && employees) {
      const emp = employees.find((e: any) => e.id === employeeId);
      if (emp) {
        empDetails = {
          "Full Name": emp.full_name,
          "Employee ID": emp.employee_id,
          "Department": emp.department?.name,
          "Designation": emp.designation,
          "Email": emp.email
        };
      }
    }

    let finalRequirements = requirements;
    
    if (docType === 'offer_letter' && ctc) {
      const ctcValue = parseFloat(ctc);
      if (!isNaN(ctcValue) && ctcValue > 0) {
        const basicYearly = ctcValue * 0.5;
        const hraYearly = basicYearly * 0.4;
        const pfYearly = basicYearly * 0.12;
        const specialYearly = ctcValue - (basicYearly + hraYearly + pfYearly);
        
        const formatCurr = (val: number) => `Rs. ${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        
        const table = `
| Salary Component | Monthly | Yearly |
|---|---|---|
| **Basic Salary** | ${formatCurr(basicYearly / 12)} | ${formatCurr(basicYearly)} |
| **HRA** | ${formatCurr(hraYearly / 12)} | ${formatCurr(hraYearly)} |
| **Special Allowance** | ${formatCurr(specialYearly / 12)} | ${formatCurr(specialYearly)} |
| **Employer PF** | ${formatCurr(pfYearly / 12)} | ${formatCurr(pfYearly)} |
| **Total CTC** | **${formatCurr(ctcValue / 12)}** | **${formatCurr(ctcValue)}** |
`;
        finalRequirements = `${requirements}\n\nIMPORTANT: Please include exactly this table at the end of the letter for the salary breakdown:\n\n${table}\n`;
      }
    }

    setIsGenerating(true);
    try {
      const res = await documentsApi.generateDraft({
        document_type: docType,
        employee_details: empDetails,
        requirements: finalRequirements
      });
      setGeneratedText(res.data.content);
      toast.success('Document drafted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedText) return;
    try {
      await documentsApi.downloadGenerated({
        document_name: docName,
        content: generatedText
      });
      toast.success('Downloaded successfully');
    } catch (e) {
      // Handled in api interceptor / method
    }
  };

  const handleUpload = async () => {
    if (!generatedText || !employeeId) {
      toast.error('Please select an employee and ensure document is generated.');
      return;
    }
    setIsSaving(true);
    try {
      await documentsApi.saveGenerated({
        employee_id: employeeId as number,
        document_type: docType,
        document_name: docName,
        content: generatedText
      });
      toast.success('Document uploaded to employee profile successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
          AI Document Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Draft official HR documents using AI and upload them directly to employee profiles.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" /> Document Details
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={docType}
                  label="Document Type"
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {DOCUMENT_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Document Name (for saving)"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Employee (Optional for generation)</InputLabel>
                <Select
                  value={employeeId}
                  label="Select Employee (Optional for generation)"
                  onChange={(e) => setEmployeeId(e.target.value as number)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {employees?.map((emp: any) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Requirements & Specific Details"
                placeholder="E.g., Include 6 months probation..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                sx={{ mb: 3 }}
              />

              {docType === 'offer_letter' && (
                <TextField
                  fullWidth
                  label="Yearly CTC (₹)"
                  type="number"
                  placeholder="e.g. 1200000"
                  value={ctc}
                  onChange={(e) => setCtc(e.target.value)}
                  sx={{ mb: 3 }}
                />
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                onClick={handleGenerate}
                disabled={isGenerating || !docType || !requirements}
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
              >
                {isGenerating ? 'Drafting...' : 'Generate Letter Text'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Editor */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Draft Preview
              </Typography>
              
              <TextField
                fullWidth
                multiline
                minRows={15}
                maxRows={20}
                placeholder="The generated document text will appear here. You can manually edit this text before saving."
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                sx={{ flex: 1, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  disabled={!generatedText}
                  sx={{ borderRadius: 2 }}
                >
                  Download PDF
                </Button>
                
                <Button
                  variant="contained"
                  color="success"
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                  onClick={handleUpload}
                  disabled={!generatedText || !employeeId || isSaving}
                  sx={{ borderRadius: 2 }}
                >
                  {isSaving ? 'Uploading...' : 'Upload to Employee Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
