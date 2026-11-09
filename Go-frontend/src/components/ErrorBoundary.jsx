import React from 'react';
import { Box, Button, Typography, Card } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: '#F7F7F7',
            p: 3,
          }}
        >
          <Card
            sx={{
              maxWidth: 500,
              p: 5,
              borderRadius: '20px',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#FFF0F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorOutline sx={{ fontSize: 48, color: '#FF385C' }} />
            </Box>

            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#222222',
                mb: 2,
              }}
            >
              Oops! Something went wrong
            </Typography>

            <Typography
              sx={{
                fontSize: '16px',
                color: '#666666',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              We encountered an unexpected error. Don't worry, our team has been
              notified. Please try refreshing the page.
            </Typography>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReset}
              sx={{
                bgcolor: '#FF385C',
                '&:hover': { bgcolor: '#E31C5F' },
                height: '48px',
                px: 4,
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              Go to Homepage
            </Button>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
