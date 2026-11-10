import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Container,
  Typography,
  Autocomplete,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Card,
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Menu as MenuIcon,
  AutoAwesome,
  DirectionsBus,
  Security,
  ConfirmationNumber,
  Route as RouteIcon,
  LocationCity,
  Speed,
} from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';
import { CITIES } from '../constants/cities';

const AnimatedSection = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const FloatingBadge = ({ children, delay = 0, x = 0 }) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-10, 10, -10] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      style={{
        position: 'absolute',
        left: x < 0 ? '5%' : 'auto',
        right: x > 0 ? '5%' : 'auto',
        bottom: '10%',
      }}
    >
      <Chip
        label={children}
        sx={{
          bgcolor: 'white',
          color: '#FF385C',
          fontWeight: 600,
          fontSize: '14px',
          py: 2.5,
          px: 1,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      />
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchForm, setSearchForm] = useState({
    source: null,
    destination: null,
    date: dayjs(),
    vehicleType: 'all',
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!searchForm.source) {
      toast.error('Please select a departure city');
      return;
    }

    if (!searchForm.destination) {
      toast.error('Please select a destination city');
      return;
    }

    if (searchForm.source === searchForm.destination) {
      toast.error('Departure and destination cities must be different');
      return;
    }

    if (searchForm.date && searchForm.date.isBefore(dayjs(), 'day')) {
      toast.error('Please select a future date');
      return;
    }

    const params = new URLSearchParams({
      source: searchForm.source,
      destination: searchForm.destination,
      date: searchForm.date.format('YYYY-MM-DD'),
      vehicleType: searchForm.vehicleType.toLowerCase(),
    });
    navigate(`/search?${params.toString()}`);
  };

  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  return (
    <Box sx={{ bgcolor: '#F7F7F7' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #eeeeee',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '24px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <span style={{ color: '#FF385C' }}>Track</span>
            <span style={{ color: '#222222' }}>Go</span>
          </Typography>

          {isMobile ? (
            <>
              <IconButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <List sx={{ width: 250 }}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => navigate('/login')}>
                      <ListItemText primary="Login" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => navigate('/register')}>
                      <ListItemText primary="Get Started" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                sx={{ color: '#FF385C', borderColor: '#FF385C' }}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: '#FF385C', '&:hover': { bgcolor: '#E31C5F' } }}
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          minHeight: '92vh',
          background: 'linear-gradient(135deg, #FF385C 0%, #E31C5F 50%, #FF6B35 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          py: 8,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              mb: 6,
            }}
          >
            <Chip
              label="AI-Powered Travel"
              sx={{
                bgcolor: 'white',
                color: '#FF385C',
                fontWeight: 600,
                mb: 3,
                fontSize: '14px',
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: 'clamp(40px, 6vw, 72px)',
                fontWeight: 800,
                lineHeight: 1.1,
                mb: 3,
              }}
            >
              Book Smarter,
              <br />
              Travel Faster
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontSize: '18px',
                opacity: 0.9,
                maxWidth: '520px',
                mx: 'auto',
                mb: 6,
                lineHeight: 1.6,
              }}
            >
              Find the best bus and train tickets with AI recommendations for crowd, price, and timing.
            </Typography>

            <Card
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                borderRadius: '20px',
                p: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: '900px',
                mx: 'auto',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={CITIES}
                    value={searchForm.source}
                    onChange={(e, newValue) =>
                      setSearchForm({ ...searchForm, source: newValue })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="From" required fullWidth />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={CITIES}
                    value={searchForm.destination}
                    onChange={(e, newValue) =>
                      setSearchForm({ ...searchForm, destination: newValue })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="To" required fullWidth />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      value={searchForm.date}
                      onChange={(newValue) =>
                        setSearchForm({ ...searchForm, date: newValue })
                      }
                      minDate={dayjs()}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <Select
                      value={searchForm.vehicleType}
                      onChange={(e) =>
                        setSearchForm({ ...searchForm, vehicleType: e.target.value })
                      }
                      displayEmpty
                    >
                      <MenuItem value="all">All Vehicles</MenuItem>
                      <MenuItem value="bus">Bus</MenuItem>
                      <MenuItem value="train">Train</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: '#FF385C',
                      height: '54px',
                      fontSize: '16px',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#E31C5F' },
                    }}
                  >
                    Search Tickets
                  </Button>
                </Grid>
              </Grid>
            </Card>
          </Box>
        </Container>

        {!isMobile && (
          <>
            <FloatingBadge delay={0} x={-1}>
              <ConfirmationNumber sx={{ mr: 0.5, fontSize: 18 }} />
              1.2M+ Tickets Booked
            </FloatingBadge>
            <FloatingBadge delay={1} x={1}>
              <RouteIcon sx={{ mr: 0.5, fontSize: 18 }} />
              50+ Routes
            </FloatingBadge>
            <FloatingBadge delay={2} x={-1}>
              <AutoAwesome sx={{ mr: 0.5, fontSize: 18 }} />
              AI Recommendations
            </FloatingBadge>
          </>
        )}
      </Box>

      <AnimatedSection>
        <Box
          ref={statsRef}
          sx={{
            bgcolor: 'white',
            py: 6,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {[
                { number: '1.2M+', label: 'Tickets Booked' },
                { number: '50+', label: 'Routes' },
                { number: '15', label: 'Cities' },
                { number: '99.9%', label: 'Uptime' },
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      borderRight: index < 3 && !isMobile ? '1px solid #e0e0e0' : 'none',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '48px',
                        fontWeight: 800,
                        color: '#FF385C',
                        lineHeight: 1,
                        mb: 1,
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        color: '#666666',
                        fontWeight: 500,
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </AnimatedSection>

      <AnimatedSection>
        <Box
          ref={featuresRef}
          sx={{
            bgcolor: '#F7F7F7',
            py: 10,
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h2"
              sx={{
                fontSize: '36px',
                fontWeight: 800,
                textAlign: 'center',
                mb: 6,
                color: '#222222',
              }}
            >
              Everything you need to travel smart
            </Typography>

            <Grid container spacing={4}>
              {[
                {
                  icon: <AutoAwesome sx={{ fontSize: 40 }} />,
                  title: 'Smart Predictions',
                  description:
                    'Our AI predicts crowd levels, best travel times, and cheapest days using Neural Networks.',
                },
                {
                  icon: <DirectionsBus sx={{ fontSize: 40 }} />,
                  title: '50+ Routes',
                  description: 'Bus and train routes across 15 major cities of Pakistan.',
                },
                {
                  icon: <Security sx={{ fontSize: 40 }} />,
                  title: 'Secure Booking',
                  description:
                    'JWT-protected accounts, atomic seat locking, instant confirmations.',
                },
              ].map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      borderRadius: '20px',
                      p: 4,
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        bgcolor: '#FFF0F3',
                        color: '#FF385C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontSize: '24px',
                        fontWeight: 700,
                        mb: 2,
                        color: '#222222',
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        color: '#666666',
                        lineHeight: 1.7,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </AnimatedSection>

      <AnimatedSection>
        <Box
          ref={ctaRef}
          sx={{
            background: 'linear-gradient(135deg, #FF385C 0%, #FF6B35 100%)',
            color: 'white',
            py: 10,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography
              variant="h2"
              sx={{
                fontSize: '48px',
                fontWeight: 800,
                mb: 3,
              }}
            >
              Ready to travel smarter?
            </Typography>
            <Typography
              sx={{
                fontSize: '20px',
                opacity: 0.9,
                mb: 5,
                lineHeight: 1.6,
              }}
            >
              Join thousands of travelers who book their tickets with confidence using AI-powered insights.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: '#FF385C',
                fontSize: '18px',
                fontWeight: 700,
                px: 6,
                py: 2,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              Get Started Free
            </Button>
          </Container>
        </Box>
      </AnimatedSection>

      <Footer />
    </Box>
  );
};

export default LandingPage;
