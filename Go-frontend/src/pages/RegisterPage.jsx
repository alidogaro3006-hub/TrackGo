import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';

const schema = yup.object({
  name: yup.string().required('Full name is required').min(3, 'Name must be at least 3 characters'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^0\d{10}$/, 'Phone must be exactly 11 digits starting with 0'),
}).required();

const RegisterPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });

      if (response.data.success) {
        toast.success('Account created! Please login.');
        navigate('/login');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed. Please try again.';
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
              Start your journey with TrackGo
            </Typography>
            <Typography
              sx={{
                fontSize: '18px',
                opacity: 0.9,
                mb: 5,
                lineHeight: 1.6,
              }}
            >
              Join thousands of travelers booking smarter with AI-powered recommendations.
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
              Create your account
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#666666',
                mb: 4,
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#FF385C',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Login
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
                label="Full Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#666666' }} />
                    </InputAdornment>
                  ),
                }}
              />

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

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Phone Number"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                placeholder="03001234567"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: '#666666' }} />
                    </InputAdornment>
                  ),
                }}
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
                  'Create Account'
                )}
              </Button>
            </form>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default RegisterPage;
