import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Collapse,
  TextField,
  MenuItem,
  Grid,
  IconButton,
} from '@mui/material';
import {
  DirectionsBus,
  Train,
  EditRounded,
  ArrowForward,
  EventSeat,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import { searchSchedules } from '../api';
import { CITIES } from '../constants/cities';

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [source, setSource] = useState(searchParams.get('source') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(dayjs(searchParams.get('date')) || dayjs());
  const [vehicleType, setVehicleType] = useState(searchParams.get('vehicleType') || 'all');

  const [sortBy, setSortBy] = useState('departure');
  const [filterType, setFilterType] = useState('all');

  const cities = CITIES;

  useEffect(() => {
    const source = searchParams.get('source');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    if (source && destination && date) {
      fetchSchedules();
    } else {
      setEditMode(true);
    }
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [schedules, sortBy, filterType]);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const params = {
        source: searchParams.get('source'),
        destination: searchParams.get('destination'),
        date: searchParams.get('date'),
      };

      if (searchParams.get('vehicleType') && searchParams.get('vehicleType') !== 'all') {
        params.vehicleType = searchParams.get('vehicleType');
      }

      const response = await searchSchedules(params);
      if (response.data.success) {
        setSchedules(response.data.data.schedules || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...schedules];

    if (filterType !== 'all') {
      filtered = filtered.filter((s) => s.vehicleId?.type === filterType);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'departure':
          return a.departureTime.localeCompare(b.departureTime);
        case 'price':
          return a.price - b.price;
        case 'available':
          return (
            b.vehicleId?.capacity -
            b.bookedSeats?.length -
            (a.vehicleId?.capacity - a.bookedSeats?.length)
          );
        default:
          return 0;
      }
    });

    setFilteredSchedules(filtered);
  };

  const handleEditSearch = () => {
    const params = new URLSearchParams({
      source,
      destination,
      date: date.format('YYYY-MM-DD'),
      vehicleType,
    });
    navigate(`/search?${params.toString()}`);
    window.location.reload();
  };

  const handleBookNow = (schedule) => {
    navigate(`/seats/${schedule._id}`, { state: { schedule } });
  };

  const getAvailableSeats = (schedule) => {
    const total = schedule.vehicleId?.capacity || 0;
    const booked = schedule.bookedSeats?.length || 0;
    return total - booked;
  };

  const getSeatColor = (available) => {
    if (available > 10) return '#10B981';
    if (available >= 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <AppShell pageTitle="Search Results">
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#222222',
                  mb: 0.5,
                }}
              >
                {searchParams.get('source')} → {searchParams.get('destination')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '14px', color: '#666666' }}>
                  {dayjs(searchParams.get('date')).format('MMM DD, YYYY')}
                </Typography>
                {searchParams.get('vehicleType') && searchParams.get('vehicleType') !== 'all' && (
                  <Chip
                    label={searchParams.get('vehicleType')}
                    size="small"
                    sx={{
                      bgcolor: '#FFF0F3',
                      color: '#FF385C',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                )}
              </Box>
            </Box>
            <IconButton
              onClick={() => setEditMode(!editMode)}
              sx={{
                bgcolor: '#F7F7F7',
                '&:hover': { bgcolor: '#FF385C', color: 'white' },
              }}
            >
              <EditRounded />
            </IconButton>
          </Box>

          <Collapse in={editMode}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="From"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    size="small"
                  >
                    {cities.map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="To"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    size="small"
                  >
                    {cities.map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date"
                    value={date}
                    onChange={(newValue) => setDate(newValue)}
                    minDate={dayjs()}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Vehicle Type"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="bus">Bus</MenuItem>
                    <MenuItem value="train">Train</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleEditSearch}
                    sx={{
                      bgcolor: '#FF385C',
                      '&:hover': { bgcolor: '#E31C5F' },
                      height: '48px',
                      borderRadius: '12px',
                    }}
                  >
                    Update Search
                  </Button>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Collapse>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: '16px',
            mb: 3,
            position: 'sticky',
            top: 80,
            zIndex: 10,
            bgcolor: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Tabs
              value={filterType}
              onChange={(e, v) => setFilterType(v)}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                '& .Mui-selected': { color: '#FF385C' },
                '& .MuiTabs-indicator': { bgcolor: '#FF385C' },
              }}
            >
              <Tab label="All" value="all" />
              <Tab label="Bus" value="bus" />
              <Tab label="Train" value="train" />
            </Tabs>

            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(e, v) => v && setSortBy(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root.Mui-selected': {
                  bgcolor: '#FF385C',
                  color: 'white',
                  '&:hover': { bgcolor: '#E31C5F' },
                },
              }}
            >
              <ToggleButton value="departure">Departure Time</ToggleButton>
              <ToggleButton value="price">Price Low→High</ToggleButton>
              <ToggleButton value="available">Most Available</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Card>

        {isLoading ? (
          <Box>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={160}
                sx={{ borderRadius: '20px', mb: 2 }}
              />
            ))}
          </Box>
        ) : filteredSchedules.length === 0 ? (
          <Card
            sx={{
              p: 6,
              borderRadius: '20px',
              textAlign: 'center',
            }}
          >
            <svg
              width="200"
              height="120"
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ margin: '0 auto 24px' }}
            >
              <rect x="20" y="40" width="160" height="60" rx="8" fill="#F7F7F7" />
              <rect x="30" y="50" width="40" height="40" rx="4" fill="#E0E0E0" />
              <rect x="80" y="50" width="40" height="40" rx="4" fill="#E0E0E0" />
              <rect x="130" y="50" width="40" height="40" rx="4" fill="#E0E0E0" />
              <circle cx="40" cy="105" r="8" fill="#BDBDBD" />
              <circle cx="160" cy="105" r="8" fill="#BDBDBD" />
            </svg>
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#222222',
                mb: 1,
              }}
            >
              No trips found
            </Typography>
            <Typography sx={{ fontSize: '16px', color: '#666666', mb: 3 }}>
              Try a different date or route
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/search')}
              sx={{
                bgcolor: '#FF385C',
                '&:hover': { bgcolor: '#E31C5F' },
                height: '48px',
                px: 4,
                borderRadius: '12px',
              }}
            >
              Go Back
            </Button>
          </Card>
        ) : (
          <Box>
            {filteredSchedules.map((schedule, index) => {
              const available = getAvailableSeats(schedule);
              const isAvailable = available > 0;

              return (
                <motion.div
                  key={schedule._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      mb: 2,
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      },
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              bgcolor:
                                schedule.vehicleId?.type === 'bus'
                                  ? '#E6FAF8'
                                  : '#FFF0F3',
                              color:
                                schedule.vehicleId?.type === 'bus'
                                  ? '#00A699'
                                  : '#FF385C',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 1,
                            }}
                          >
                            {schedule.vehicleId?.type === 'bus' ? (
                              <DirectionsBus sx={{ fontSize: 32 }} />
                            ) : (
                              <Train sx={{ fontSize: 32 }} />
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#666666',
                              textTransform: 'uppercase',
                            }}
                          >
                            {schedule.vehicleId?.type || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={5}>
                        <Typography
                          sx={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#222222',
                            mb: 1,
                          }}
                        >
                          {schedule.routeId?.source} → {schedule.routeId?.destination}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
                            {schedule.departureTime}
                          </Typography>
                          <Box
                            sx={{
                              flex: 1,
                              height: 2,
                              borderTop: '2px dotted #E0E0E0',
                              maxWidth: 80,
                            }}
                          />
                          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
                            {schedule.arrivalTime}
                          </Typography>
                          <Chip
                            label={schedule.duration || 'N/A'}
                            size="small"
                            sx={{
                              bgcolor: '#F7F7F7',
                              fontSize: '11px',
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: '12px', color: '#999999' }}>
                          {schedule.vehicleId?.registrationNumber || 'N/A'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={5}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize: '24px',
                                fontWeight: 800,
                                color: '#FF385C',
                                lineHeight: 1,
                                mb: 0.5,
                              }}
                            >
                              PKR {schedule.price}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                              /person
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mt: 1,
                              }}
                            >
                              <EventSeat
                                sx={{ fontSize: 14, color: getSeatColor(available) }}
                              />
                              <Typography
                                sx={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: getSeatColor(available),
                                }}
                              >
                                {available} seats left
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            onClick={() => handleBookNow(schedule)}
                            disabled={!isAvailable}
                            sx={{
                              bgcolor: '#FF385C',
                              '&:hover': { bgcolor: '#E31C5F' },
                              height: '48px',
                              px: 3,
                              borderRadius: '12px',
                              fontWeight: 600,
                              '&:disabled': {
                                bgcolor: '#E0E0E0',
                                color: '#999999',
                              },
                            }}
                            endIcon={<ArrowForward />}
                          >
                            Book Now
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </motion.div>
              );
            })}
          </Box>
        )}
      </Box>
    </AppShell>
  );
};

export default SearchResultsPage;
