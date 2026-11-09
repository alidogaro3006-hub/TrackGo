import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

const schema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email'),
  password: yup.string().required('Password is required'),
}).required();

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/dashboard';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate(from);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Box
          sx={{
            width: '45%',
            bgcolor: '#FF385C',
            color: 'white',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            p: 6,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '24px',
              fontWeight: 800,
              mb: 'auto',
            }}
          >
            <span style={{ color: 'white' }}>Track</span>
            <span style={{ color: 'white' }}>Go</span>
          </Typography>

          <Box sx={{ mb: 'auto', mt: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: '48px',
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 3,
              }}
            >
              Welcome back to TrackGo
            </Typography>
            <Typography
              sx={{
                fontSize: '18px',
                opacity: 0.9,
                mb: 5,
                lineHeight: 1.6,
              }}
            >
              Continue your journey with AI-powered travel recommendations.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                'AI-powered travel recommendations',
                'Secure booking with instant confirmation',
                'Access to 50+ routes across Pakistan',
              ].map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ fontSize: 24 }} />
                  <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '120px',
              opacity: 0.1,
            }}
          >
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%' }}
            >
              <path
                d="M0,0 Q300,60 600,40 T1200,60 L1200,120 L0,120 Z"
                fill="white"
              />
            </svg>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          width: isMobile ? '100%' : '55%',
          bgcolor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                mb: 1,
                color: '#222222',
              }}
            >
              Welcome back
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#666666',
                mb: 4,
              }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#FF385C',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign up
              </Link>
            </Typography>

            {apiError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {apiError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#666666' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#666666' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: '#FF385C',
                      '&.Mui-checked': {
                        color: '#FF385C',
                      },
                    }}
                  />
                }
                label="Remember me"
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  height: '52px',
                  bgcolor: '#FF385C',
                  fontSize: '16px',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#E31C5F',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginPage;
