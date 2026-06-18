import React from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Select, MenuItem, FormControl, InputLabel, alpha, Skeleton, Tooltip
} from '@mui/material';
import { Download, Description, Folder } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../services/api';
import { useAppSelector } from '../../store';
import { Document } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useState } from 'react';

const DOC_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  offer_letter: { label: 'Offer Letter', color: '#1565C0' },
  appointment_letter: { label: 'Appointment Letter', color: '#1565C0' },
  experience_letter: { label: 'Experience Letter', color: '#6A1B9A' },
  form16: { label: 'Form 16', color: '#E65100' },
  tax_document: { label: 'Tax Document', color: '#E65100' },
  certificate: { label: 'Certificate', color: '#2E7D32' },
  policy: { label: 'Policy', color: '#37474F' },
  id_card: { label: 'ID Card', color: '#1565C0' },
  other: { label: 'Other', color: '#607D8B' },
};

export default function DocumentsPage() {
  const isDark = useAppSelector((s) => s.ui.themeMode) === 'dark';
  const [filterType, setFilterType] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', filterType],
    queryFn: () => documentsApi.list(filterType || undefined).then((r) => r.data),
  });

  const handleDownload = async (doc: Document) => {
    // Left empty, downloads are now handled by AI Chatbot
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Document Center</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            View your official HR documents
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Financial Year</TableCell>
                  <TableCell>Generated On</TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Downloads</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : documents?.length > 0 ? (
                  documents.map((doc: Document) => {
                    const typeConf = DOC_TYPE_CONFIG[doc.document_type] || DOC_TYPE_CONFIG.other;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 36, height: 36, borderRadius: '10px',
                              background: alpha(typeConf.color, 0.1),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Description sx={{ color: typeConf.color, fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{doc.document_name}</Typography>
                              {doc.description && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                  {doc.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Chip
                            label={typeConf.label}
                            size="small"
                            sx={{
                              background: alpha(typeConf.color, 0.1),
                              color: typeConf.color,
                              fontWeight: 700, fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2">{doc.financial_year || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(doc.created_at), 'dd MMM yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Chip label={doc.download_count} size="small" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                      <Folder sx={{ fontSize: 56, opacity: 0.2, mb: 1 }} />
                      <Typography color="text.secondary" gutterBottom>No documents found</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        To request or download documents, please ask the AI Assistant.
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
