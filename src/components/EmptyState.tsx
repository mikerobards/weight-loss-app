'use client';

import { Box, Typography, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'No data yet',
  description = 'Import your Weight Gurus or MyFitnessPal CSV to get started.',
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        gap: 2,
        textAlign: 'center',
      }}
    >
      <UploadFileIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.disabled" maxWidth={360}>
        {description}
      </Typography>
      <Button component={Link} href="/import" variant="contained" startIcon={<UploadFileIcon />}>
        Import Data
      </Button>
    </Box>
  );
}
