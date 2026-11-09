import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  DirectionsBus,
  ConfirmationNumber,
  Cancel,
  LocationOn,
  ArrowForward,
  SearchRounded,
  AutoAwesomeRounded,
  ConfirmationNumberRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getMyBookings();
        if (response.data.success) {
          setBookings(response.data.data.bookings);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        toast.error('Failed to load your bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );
  const totalBookings = bookings.length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

  const uniqueCities = new Set();
  bookings.forEach((booking) => {
    if (booking.scheduleId?.routeId?.source) uniqueCities.add(booking.scheduleId.routeId.source);
    if (booking.scheduleId?.routeId?.destination)
      uniqueCities.add(booking.scheduleId.routeId.destination);
  });
  const citiesVisited = uniqueCities.size;

  const recentBookings = bookings.slice(0, 3);

  const StatCard = ({ icon, label, value, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: '16px',
          position: 'relative',
          overflow: 'visible',
          borderLeft: `4px solid ${color}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#222222',
            mb: 0.5,
          }}
        >
          {isLoading ? <Skeleton width={60} /> : value}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            color: '#666666',
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
      </Card>
    </motion.div>
  );

  const QuickActionCard = ({ icon, label, path, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card
        onClick={() => navigate(path)}
        sx={{
          p: 3,
          borderRadius: '16px',
          cursor: 'pointer',
          border: '2px solid transparent',
          '&:hover': {
            borderColor: '#FF385C',
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(255, 56, 92, 0.15)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: '#FFF0F3',
              color: '#FF385C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography
            sx={{
              flex: 1,
              fontSize: '16px',
              fontWeight: 600,
              color: '#222222',
            }}
          >
            {label}
          </Typography>
          <ArrowForward sx={{ color: '#FF385C' }} />
        </Box>
      </Card>
    </motion.div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <AppShell pageTitle="Dashboard">
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            sx={{
              p: 4,
              borderRadius: '20px',
              mb: 4,
              background: 'linear-gradient(135deg, #FF385C 0%, #FF6B35 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: '24px', md: '32px' },
                  }}
                >
                  {getTimeOfDay()}, {user?.name}! 👋
                </Typography>
                <Typography
                  sx={{
                    fontSize: '16px',
                    opacity: 0.9,
                  }}
                >
                  You have {upcomingBookings.length} upcoming trip
                  {upcomingBookings.length !== 1 ? 's' : ''}.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <svg
                    width="200"
                    height="120"
                    viewBox="0 0 200 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="20" y="40" width="160" height="60" rx="8" fill="white" opacity="0.9" />
                    <rect x="30" y="50" width="40" height="40" rx="4" fill="#00A699" />
                    <rect x="80" y="50" width="40" height="40" rx="4" fill="#00A699" />
                    <rect x="130" y="50" width="40" height="40" rx="4" fill="#00A699" />
                    <circle cx="40" cy="105" r="8" fill="#222222" />
                    <circle cx="160" cy="105" r="8" fill="#222222" />
                    <path
                      d="M10 70 L20 70 M180 70 L190 70"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  </svg>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </motion.div>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<DirectionsBus sx={{ fontSize: 28 }} />}
              label="Upcoming Trips"
              value={upcomingBookings.length}
              color="#FF385C"
              delay={0.1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<ConfirmationNumber sx={{ fontSize: 28 }} />}
              label="Total Bookings"
              value={totalBookings}
              color="#00A699"
              delay={0.2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Cancel sx={{ fontSize: 28 }} />}
              label="Cancelled"
              value={cancelledBookings}
              color="#FF6B35"
              delay={0.3}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<LocationOn sx={{ fontSize: 28 }} />}
              label="Cities Visited"
              value={citiesVisited}
              color="#7C3AED"
              delay={0.4}
            />
          </Grid>
        </Grid>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card sx={{ p: 3, borderRadius: '20px', mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#222222',
                }}
              >
                Recent Bookings
              </Typography>
              <Button
                onClick={() => navigate('/bookings')}
                sx={{
                  color: '#FF385C',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                See all bookings
              </Button>
            </Box>

            {isLoading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : recentBookings.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  color: '#666666',
                }}
              >
                <ConfirmationNumberRounded
                  sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }}
                />
                <Typography sx={{ fontSize: '16px' }}>
                  No bookings yet. Start by searching for tickets!
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/search')}
                  sx={{
                    mt: 3,
                    bgcolor: '#FF385C',
                    '&:hover': { bgcolor: '#E31C5F' },
                  }}
                >
                  Search Tickets
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Seats</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow key={booking._id} hover>
                        <TableCell>
                          <Chip
                            label={`${booking.scheduleId?.routeId?.source || 'N/A'} → ${
                              booking.scheduleId?.routeId?.destination || 'N/A'
                            }`}
                            sx={{
                              bgcolor: '#FFF0F3',
                              color: '#FF385C',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {booking.scheduleId?.date
                            ? new Date(booking.scheduleId.date).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {booking.seats?.length || 0} seat
                          {booking.seats?.length !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={booking.status || 'unknown'}
                            color={getStatusColor(booking.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate('/bookings')}
                            sx={{
                              color: '#FF385C',
                              fontWeight: 600,
                              textTransform: 'none',
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '20px',
              color: '#222222',
              mb: 3,
            }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <QuickActionCard
                icon={<SearchRounded sx={{ fontSize: 28 }} />}
                label="Search Tickets"
                path="/search"
                delay={0.7}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickActionCard
                icon={<AutoAwesomeRounded sx={{ fontSize: 28 }} />}
                label="AI Recommendations"
                path="/recommendations"
                delay={0.8}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickActionCard
                icon={<ConfirmationNumberRounded sx={{ fontSize: 28 }} />}
                label="My Bookings"
                path="/bookings"
                delay={0.9}
              />
            </Grid>
          </Grid>
        </motion.div>
      </Box>
    </AppShell>
  );
};

export default DashboardPage;
