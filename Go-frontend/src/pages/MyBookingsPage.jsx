import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  useMediaQuery,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Visibility,
  Cancel,
  ConfirmationNumber,
  DirectionsBus,
  Train,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import { getMyBookings, cancelBooking } from '../api';

const MyBookingsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelDialog, setCancelDialog] = useState({ open: false, booking: null });
  const [viewDialog, setViewDialog] = useState({ open: false, booking: null });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [bookings, filter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await getMyBookings();
      if (response.data.success) {
        const sortedBookings = (response.data.data?.bookings || []).sort(
          (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        setBookings(sortedBookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === filter));
    }
  };

  const getCounts = () => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      pending: bookings.filter((b) => b.status === 'pending').length,
    };
  };

  const handleCancelClick = (booking) => {
    setCancelDialog({ open: true, booking });
  };

  const handleViewClick = (booking) => {
    setViewDialog({ open: true, booking });
  };

  const handleCancelConfirm = async () => {
    const booking = cancelDialog.booking;
    setCancelDialog({ open: false, booking: null });

    const originalBookings = [...bookings];
    setBookings(
      bookings.map((b) =>
        b._id === booking._id ? { ...b, status: 'cancelled' } : b
      )
    );

    try {
      const response = await cancelBooking(booking._id);
      if (response.data.success) {
        toast.success('Booking cancelled successfully');
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking');
      setBookings(originalBookings);
    }
  };

  const getStatusChip = (status) => {
    const config = {
      confirmed: { color: 'success', label: 'Confirmed' },
      cancelled: { color: 'error', label: 'Cancelled' },
      pending: { color: 'warning', label: 'Pending' },
    };
    const { color, label } = config[status] || config.pending;
    return <Chip label={label} color={color} size="small" />;
  };

  const counts = getCounts();

  return (
    <AppShell pageTitle="My Bookings">
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={`Total: ${counts.total}`}
            onClick={() => setFilter('all')}
            sx={{
              bgcolor: filter === 'all' ? '#FF385C' : '#F7F7F7',
              color: filter === 'all' ? 'white' : '#666666',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: filter === 'all' ? '#E31C5F' : '#E0E0E0',
              },
            }}
          />
          <Chip
            label={`Confirmed: ${counts.confirmed}`}
            onClick={() => setFilter('confirmed')}
            sx={{
              bgcolor: filter === 'confirmed' ? '#10B981' : '#F7F7F7',
              color: filter === 'confirmed' ? 'white' : '#666666',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: filter === 'confirmed' ? '#059669' : '#E0E0E0',
              },
            }}
          />
          <Chip
            label={`Cancelled: ${counts.cancelled}`}
            onClick={() => setFilter('cancelled')}
            sx={{
              bgcolor: filter === 'cancelled' ? '#EF4444' : '#F7F7F7',
              color: filter === 'cancelled' ? 'white' : '#666666',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: filter === 'cancelled' ? '#DC2626' : '#E0E0E0',
              },
            }}
          />
          <Chip
            label={`Pending: ${counts.pending}`}
            onClick={() => setFilter('pending')}
            sx={{
              bgcolor: filter === 'pending' ? '#F59E0B' : '#F7F7F7',
              color: filter === 'pending' ? 'white' : '#666666',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: filter === 'pending' ? '#D97706' : '#E0E0E0',
              },
            }}
          />
        </Box>

        {isLoading ? (
          <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={80}
                sx={{ mb: 1 }}
              />
            ))}
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card
            sx={{
              p: 6,
              borderRadius: '20px',
              textAlign: 'center',
            }}
          >
            <svg
              width="200"
              height="160"
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ margin: '0 auto 24px' }}
            >
              <rect x="40" y="50" width="120" height="80" rx="8" fill="#F7F7F7" />
              <path
                d="M60 70 L140 70 L130 80 L70 80 Z"
                fill="#E0E0E0"
              />
              <circle cx="100" cy="100" r="15" fill="#FF385C" opacity="0.3" />
              <path
                d="M95 100 L100 105 L110 90"
                stroke="#FF385C"
                strokeWidth="3"
                fill="none"
              />
            </svg>
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#222222',
                mb: 1,
              }}
            >
              No bookings yet
            </Typography>
            <Typography sx={{ fontSize: '16px', color: '#666666', mb: 3 }}>
              Start by searching for a ticket
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/search'}
              sx={{
                bgcolor: '#FF385C',
                '&:hover': { bgcolor: '#E31C5F' },
                height: '48px',
                px: 4,
                borderRadius: '12px',
              }}
            >
              Search Tickets
            </Button>
          </Card>
        ) : isMobile ? (
          <Box>
            {filteredBookings.map((booking) => (
              <Card
                key={booking._id}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {booking.scheduleId?.vehicleId?.type === 'bus' ? (
                      <DirectionsBus sx={{ color: '#00A699' }} />
                    ) : (
                      <Train sx={{ color: '#FF385C' }} />
                    )}
                    <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
                      {booking.scheduleId?.routeId?.source} →{' '}
                      {booking.scheduleId?.routeId?.destination}
                    </Typography>
                  </Box>
                  {getStatusChip(booking.status)}
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                      Date
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {dayjs(booking.scheduleId?.date).format('MMM DD, YYYY')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                      Time
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {booking.scheduleId?.departureTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                      Seats
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {booking.seats?.join(', ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                      Total Price
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#FF385C',
                      }}
                    >
                      PKR {booking.totalPrice}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewClick(booking)}
                    sx={{
                      borderColor: '#E0E0E0',
                      color: '#666666',
                      '&:hover': {
                        borderColor: '#FF385C',
                        color: '#FF385C',
                      },
                    }}
                  >
                    View
                  </Button>
                  {booking.status === 'confirmed' && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={() => handleCancelClick(booking)}
                      sx={{
                        borderColor: '#EF4444',
                        color: '#EF4444',
                        '&:hover': {
                          borderColor: '#DC2626',
                          bgcolor: '#FEE2E2',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F7F7F7' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Seats</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings.map((booking, index) => (
                    <TableRow
                      key={booking._id}
                      sx={{
                        bgcolor: index % 2 === 0 ? 'white' : '#FAFAFA',
                        '&:hover': {
                          bgcolor: '#FFF0F3',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {booking.scheduleId?.vehicleId?.type === 'bus' ? (
                            <DirectionsBus sx={{ color: '#00A699', fontSize: 20 }} />
                          ) : (
                            <Train sx={{ color: '#FF385C', fontSize: 20 }} />
                          )}
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                              {booking.scheduleId?.routeId?.source} →{' '}
                              {booking.scheduleId?.routeId?.destination}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                              {booking.scheduleId?.departureTime}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {dayjs(booking.scheduleId?.date).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {booking.seats?.slice(0, 3).map((seat) => (
                            <Chip
                              key={seat}
                              label={seat}
                              size="small"
                              sx={{
                                bgcolor: '#FFF0F3',
                                color: '#FF385C',
                                fontSize: '11px',
                                height: 20,
                              }}
                            />
                          ))}
                          {booking.seats?.length > 3 && (
                            <Chip
                              label={`+${booking.seats.length - 3}`}
                              size="small"
                              sx={{
                                bgcolor: '#F7F7F7',
                                fontSize: '11px',
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: '#FF385C',
                            fontSize: '14px',
                          }}
                        >
                          PKR {booking.totalPrice}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(booking.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewClick(booking)}
                            sx={{
                              color: '#666666',
                              '&:hover': {
                                color: '#FF385C',
                                bgcolor: '#FFF0F3',
                              },
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {booking.status === 'confirmed' && (
                            <IconButton
                              size="small"
                              onClick={() => handleCancelClick(booking)}
                              sx={{
                                color: '#EF4444',
                                '&:hover': {
                                  bgcolor: '#FEE2E2',
                                },
                              }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>

      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, booking: null })}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxWidth: '500px',
            p: 2,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConfirmationNumber sx={{ color: '#FF385C' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '20px' }}>
              Cancel Booking #{cancelDialog.booking?._id?.slice(-6)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#666666', mb: 2 }}>
            This action cannot be undone. You will forfeit:
          </Typography>
          <Card
            sx={{
              bgcolor: '#FFF0F3',
              p: 2,
              borderRadius: '12px',
              border: '1px solid #FFE4E6',
            }}
          >
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#FF385C',
                textAlign: 'center',
              }}
            >
              PKR {cancelDialog.booking?.totalPrice}
            </Typography>
          </Card>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCancelDialog({ open: false, booking: null })}
            variant="outlined"
            sx={{
              borderColor: '#E0E0E0',
              color: '#666666',
              '&:hover': {
                borderColor: '#00A699',
                color: '#00A699',
              },
            }}
          >
            Keep Booking
          </Button>
          <Button
            onClick={handleCancelConfirm}
            variant="contained"
            sx={{
              bgcolor: '#FF385C',
              '&:hover': { bgcolor: '#E31C5F' },
            }}
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, booking: null })}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            p: 2,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfirmationNumber sx={{ color: '#FF385C' }} />
              <Typography sx={{ fontWeight: 700, fontSize: '20px' }}>
                Booking #{viewDialog.booking?._id?.slice(-6)}
              </Typography>
            </Box>
            {viewDialog.booking && getStatusChip(viewDialog.booking.status)}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Route</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 700 }}>
                {viewDialog.booking?.scheduleId?.routeId?.source} →{' '}
                {viewDialog.booking?.scheduleId?.routeId?.destination}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Date</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                {dayjs(viewDialog.booking?.scheduleId?.date).format('MMM DD, YYYY')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Departure – Arrival</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                {viewDialog.booking?.scheduleId?.departureTime} – {viewDialog.booking?.scheduleId?.arrivalTime}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Vehicle</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                {viewDialog.booking?.scheduleId?.vehicleId?.type} · {viewDialog.booking?.scheduleId?.vehicleId?.registrationNumber}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Seats</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                {viewDialog.booking?.seats?.join(', ')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Booked On</Typography>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                {dayjs(viewDialog.booking?.bookingDate).format('MMM DD, YYYY')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>Total Price</Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#FF385C' }}>
                PKR {viewDialog.booking?.totalPrice}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setViewDialog({ open: false, booking: null })}
            variant="contained"
            sx={{ bgcolor: '#FF385C', '&:hover': { bgcolor: '#E31C5F' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default MyBookingsPage;
