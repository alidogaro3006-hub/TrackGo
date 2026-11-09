import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { EventSeat, Close } from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import { createBooking, getScheduleById } from '../api';

const SeatSelectionPage = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [schedule, setSchedule] = useState(location.state?.schedule || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!schedule) {
      fetchScheduleDetails();
    } else {
      setBookedSeats(schedule.bookedSeats || []);
    }
  }, []);

  const fetchScheduleDetails = async () => {
    try {
      const response = await getScheduleById(scheduleId);
      if (response.data.success) {
        const scheduleData = response.data.data.schedule;
        setSchedule(scheduleData);
        setBookedSeats(scheduleData.bookedSeats || []);
      } else {
        toast.error('Schedule not found');
        navigate('/search');
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to load schedule details');
      navigate('/search');
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) {
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    setIsLoading(true);
    try {
      const response = await createBooking({
        scheduleId: schedule._id,
        seats: selectedSeats,
      });

      if (response.data.success) {
        toast.success('Booking confirmed successfully!');
        navigate('/bookings');
      }
    } catch (error) {
      console.error('Booking failed:', error);
      if (error.response?.status === 409) {
        toast.error('Seat just taken! Please reselect.');
        fetchScheduleDetails();
        setSelectedSeats([]);
      } else {
        toast.error(error.response?.data?.message || 'Booking failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateSeats = () => {
    if (!schedule?.vehicleId) return [];

    const capacity = schedule.vehicleId.capacity;
    const vehicleType = schedule.vehicleId.type;
    const seatsPerRow = vehicleType === 'bus' ? 5 : 6;
    const rows = Math.ceil(capacity / seatsPerRow);

    const seats = [];
    let seatNumber = 1;

    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < seatsPerRow; col++) {
        if (seatNumber <= capacity) {
          rowSeats.push(seatNumber);
          seatNumber++;
        } else {
          rowSeats.push(null);
        }
      }
      seats.push(rowSeats);
    }

    return seats;
  };

  const getSeatStatus = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const getSeatStyles = (status) => {
    const baseStyles = {
      width: 52,
      height: 52,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      border: '2px solid',
    };

    switch (status) {
      case 'available':
        return {
          ...baseStyles,
          borderColor: '#00A699',
          bgcolor: 'white',
          color: '#00A699',
          '&:hover': {
            bgcolor: '#E6FAF8',
          },
        };
      case 'booked':
        return {
          ...baseStyles,
          borderColor: '#FF385C',
          bgcolor: '#FFE4E6',
          color: '#FF385C',
          cursor: 'not-allowed',
          pointerEvents: 'none',
        };
      case 'selected':
        return {
          ...baseStyles,
          borderColor: '#FF385C',
          bgcolor: '#FF385C',
          color: 'white',
        };
      default:
        return baseStyles;
    }
  };

  const totalPrice = selectedSeats.length * (schedule?.price || 0);

  const SeatMap = () => {
    const seats = generateSeats();
    const vehicleType = schedule?.vehicleId?.type;
    const seatsPerRow = vehicleType === 'bus' ? 5 : 6;

    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#222222',
              mb: 2,
            }}
          >
            Select Your Seats
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  border: '2px solid #00A699',
                  bgcolor: 'white',
                }}
              />
              <Typography sx={{ fontSize: '13px', color: '#666666' }}>Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  border: '2px solid #FF385C',
                  bgcolor: '#FF385C',
                }}
              />
              <Typography sx={{ fontSize: '13px', color: '#666666' }}>Selected</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  border: '2px solid #FF385C',
                  bgcolor: '#FFE4E6',
                }}
              />
              <Typography sx={{ fontSize: '13px', color: '#666666' }}>Booked</Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'inline-block',
            p: 4,
            bgcolor: '#F7F7F7',
            borderRadius: '20px',
          }}
        >
          {seats.map((row, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  width: 24,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666666',
                  textAlign: 'center',
                }}
              >
                {String.fromCharCode(65 + rowIndex)}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {row.map((seatNumber, colIndex) => {
                  if (seatNumber === null) {
                    return <Box key={colIndex} sx={{ width: 52 }} />;
                  }

                  const status = getSeatStatus(seatNumber);
                  const isAisle =
                    vehicleType === 'bus'
                      ? colIndex === 2
                      : colIndex === 3;

                  return (
                    <Box key={colIndex} sx={{ display: 'flex', gap: 1 }}>
                      {isAisle && <Box sx={{ width: 16 }} />}
                      <Button
                        onClick={() => handleSeatClick(seatNumber)}
                        sx={getSeatStyles(status)}
                        disabled={status === 'booked'}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <EventSeat sx={{ fontSize: 24, mb: 0.5 }} />
                          <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
                            {seatNumber}
                          </Typography>
                        </Box>
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const BookingSummary = () => (
    <Card
      sx={{
        p: 3,
        borderRadius: '20px',
        position: 'sticky',
        top: 100,
      }}
    >
      <Typography
        sx={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#222222',
          mb: 3,
        }}
      >
        Booking Summary
      </Typography>

      {selectedSeats.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#666666',
              mb: 1,
            }}
          >
            Selected Seats
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedSeats.map((seat) => (
              <Chip
                key={seat}
                label={seat}
                onDelete={() => handleSeatClick(seat)}
                deleteIcon={<Close />}
                sx={{
                  bgcolor: '#FFF0F3',
                  color: '#FF385C',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': {
                    color: '#FF385C',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          py: 2,
          borderTop: '1px solid #E0E0E0',
          borderBottom: '1px solid #E0E0E0',
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: '14px', color: '#666666' }}>
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
            PKR {schedule?.price || 0}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#222222' }}>
            Total
          </Typography>
          <Typography
            sx={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#FF385C',
            }}
          >
            PKR {totalPrice}
          </Typography>
        </Box>
      </Box>

      <Button
        fullWidth
        variant="contained"
        onClick={handleConfirmBooking}
        disabled={selectedSeats.length === 0 || isLoading}
        sx={{
          bgcolor: '#FF385C',
          '&:hover': { bgcolor: '#E31C5F' },
          height: '54px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '16px',
          '&:disabled': {
            bgcolor: '#E0E0E0',
            color: '#999999',
          },
        }}
      >
        {isLoading ? 'Processing...' : 'Confirm Booking'}
      </Button>
    </Card>
  );

  if (!schedule) {
    return (
      <AppShell pageTitle="Select Seats">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Select Seats">
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            mb: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#222222',
                  mb: 0.5,
                }}
              >
                {schedule.routeId?.source} → {schedule.routeId?.destination}
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#666666' }}>
                {dayjs(schedule.date).format('MMM DD, YYYY')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}
                  >
                    Departure
                  </Typography>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 700, color: '#222222' }}
                  >
                    {schedule.departureTime}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}
                  >
                    Arrival
                  </Typography>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 700, color: '#222222' }}
                  >
                    {schedule.arrivalTime}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}
                  >
                    Price per seat
                  </Typography>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 700, color: '#FF385C' }}
                  >
                    PKR {schedule.price}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                p: 3,
                borderRadius: '20px',
              }}
            >
              <SeatMap />
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            {isMobile ? (
              <Drawer
                anchor="bottom"
                open={selectedSeats.length > 0}
                variant="persistent"
                sx={{
                  '& .MuiDrawer-paper': {
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                  },
                }}
              >
                <Box sx={{ p: 3 }}>
                  <BookingSummary />
                </Box>
              </Drawer>
            ) : (
              <BookingSummary />
            )}
          </Grid>
        </Grid>
      </Box>
    </AppShell>
  );
};

export default SeatSelectionPage;
