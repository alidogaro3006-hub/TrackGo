import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Skeleton,
  Chip,
  Grid,
} from '@mui/material';
import {
  AutoAwesome,
  Groups,
  AccessTime,
  AttachMoney,
  TrendingUp,
  DirectionsBus,
  Train,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import { getRecommendations } from '../api';
import { CITIES } from '../constants/cities';

const RecommendationsPage = () => {
  const navigate = useNavigate();

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const cities = CITIES;

  const handleAnalyze = async () => {
    if (!source || !destination) {
      toast.error('Please select both source and destination');
      return;
    }

    if (source === destination) {
      toast.error('Source and destination cannot be the same');
      return;
    }

    setIsLoading(true);
    try {
      const response = await getRecommendations({
        source,
        destination,
        date: date.format('YYYY-MM-DD'),
      });

      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error(error.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSlot = () => {
    const params = new URLSearchParams({
      source,
      destination,
      date: date.format('YYYY-MM-DD'),
      vehicleType: 'all',
    });
    navigate(`/search?${params.toString()}`);
  };

  const getCrowdColor = (level) => {
    if (level === 'Low') return '#10B981';
    if (level === 'Medium') return '#F59E0B';
    return '#EF4444';
  };

  const getCrowdPercent = (level) => {
    if (level === 'Low') return 30;
    if (level === 'Medium') return 65;
    return 90;
  };

  return (
    <AppShell pageTitle="AI Recommendations">
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Card
          sx={{
            p: 4,
            borderRadius: '20px',
            mb: 3,
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
              mb: 2,
              animation: 'spin 3s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <AutoAwesome sx={{ fontSize: 40, color: '#FF385C' }} />
          </Box>

          <Typography
            sx={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#222222',
              mb: 1,
            }}
          >
            AI-Powered Travel Insights
          </Typography>

          <Typography
            sx={{
              fontSize: '16px',
              color: '#666666',
              mb: 4,
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Our Neural Network + Decision Tree hybrid analyzes historical booking
            patterns to recommend the smartest way to travel.
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ maxWidth: '800px', mx: 'auto' }}>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  value={source}
                  onChange={(e, newValue) => setSource(newValue)}
                  options={cities}
                  renderInput={(params) => (
                    <TextField {...params} label="From" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  value={destination}
                  onChange={(e, newValue) => setDestination(newValue)}
                  options={cities}
                  renderInput={(params) => (
                    <TextField {...params} label="To" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  minDate={dayjs()}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  sx={{
                    bgcolor: '#FF385C',
                    '&:hover': { bgcolor: '#E31C5F' },
                    height: '56px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Card>

        {isLoading && (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={180}
                sx={{
                  borderRadius: '20px',
                  mb: 2,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }}
              />
            ))}
          </Box>
        )}

        {!isLoading && !recommendations && (
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
              <circle cx="100" cy="80" r="60" fill="#F7F7F7" />
              <path
                d="M100 50 L120 70 L110 70 L110 90 L90 90 L90 70 L80 70 Z"
                fill="#FF385C"
              />
              <circle cx="100" cy="110" r="8" fill="#00A699" />
              <circle cx="70" cy="120" r="6" fill="#00A699" />
              <circle cx="130" cy="120" r="6" fill="#00A699" />
            </svg>
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#222222',
                mb: 1,
              }}
            >
              Ready to Analyze
            </Typography>
            <Typography sx={{ fontSize: '16px', color: '#666666' }}>
              Select a route and date to get AI-powered insights
            </Typography>
          </Card>
        )}

        {!isLoading && recommendations && (
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  mb: 2,
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: '#E6FAF8',
                        color: '#00A699',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: { xs: 'auto', md: 0 },
                      }}
                    >
                      <Groups sx={{ fontSize: 40 }} />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#666666',
                        mb: 1,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Predicted Crowd Level
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '32px',
                        fontWeight: 800,
                        color: getCrowdColor(recommendations.crowdLevel),
                        mb: 0.5,
                      }}
                    >
                      {recommendations.crowdLevel}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#666666', mb: 2 }}>
                      {Math.round(recommendations.crowdPercent ?? getCrowdPercent(recommendations.crowdLevel))}% seats booked
                      {recommendations.dataSource === 'live-schedules' ? ' · live occupancy' : ''}
                    </Typography>

                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: 12,
                        bgcolor: '#F7F7F7',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          bgcolor: getCrowdColor(recommendations.crowdLevel),
                          borderRadius: '6px',
                          animation: 'fillBar 1.5s ease-out forwards',
                          '@keyframes fillBar': {
                            '0%': { width: '0%' },
                            '100%': {
                              width: `${recommendations.crowdPercent ?? getCrowdPercent(recommendations.crowdLevel)}%`,
                            },
                          },
                        }}
                      />
                    </Box>

                    <Typography sx={{ fontSize: '14px', color: '#666666' }}>
                      {recommendations.explanations?.crowd ||
                        'Based on historical booking patterns'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                    <Chip
                      label={`${Math.round((recommendations.confidence || 0) * 100)}% confident`}
                      sx={{
                        bgcolor: '#FFF0F3',
                        color: '#FF385C',
                        fontWeight: 700,
                        fontSize: '16px',
                        px: 2,
                        height: 40,
                      }}
                    />
                  </Grid>
                </Grid>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: '#FFF0F3',
                      color: '#FF385C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AccessTime sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#666666',
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Best Travel Time
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#FF385C',
                      }}
                    >
                      {recommendations.bestTravelTime || '7:00 AM – 9:00 AM'}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleBookSlot}
                    sx={{
                      bgcolor: '#FF385C',
                      '&:hover': { bgcolor: '#E31C5F' },
                      height: '48px',
                      px: 3,
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    Book this slot
                  </Button>
                </Box>
                <Typography sx={{ fontSize: '14px', color: '#666666', pl: 9 }}>
                  {recommendations.explanations?.bestTime ||
                    'This time slot typically has better availability and fewer delays'}
                </Typography>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: '#E6FAF8',
                      color: '#00A699',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#666666',
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Cheapest Day
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '24px',
                          fontWeight: 700,
                          color: '#00A699',
                        }}
                      >
                        PKR {recommendations.cheapestDayPrice || 1200}
                      </Typography>
                      <Typography sx={{ fontSize: '16px', color: '#666666' }}>
                        on {recommendations.cheapestDay || 'Wednesday'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'space-between',
                    mb: 2,
                    alignItems: 'flex-end',
                  }}
                >
                  {(recommendations.weekdayPrices?.length
                    ? recommendations.weekdayPrices.map((item) => ({
                        day: item.day.slice(0, 3),
                        price: item.avgPrice,
                        isCheapest:
                          item.day.toLowerCase() ===
                          (recommendations.cheapestDay || '').toLowerCase(),
                      }))
                    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
                        day,
                        price: null,
                        isCheapest:
                          day.toLowerCase() ===
                          (recommendations.cheapestDay || 'Wednesday')
                            .substring(0, 3)
                            .toLowerCase(),
                      }))
                  ).map((item) => {
                    const prices = (recommendations.weekdayPrices || [])
                      .map((entry) => entry.avgPrice)
                      .filter((price) => price > 0);
                    const maxPrice = Math.max(...prices, 1);
                    const height = item.price
                      ? 36 + Math.round((item.price / maxPrice) * 52)
                      : item.isCheapest
                        ? 80
                        : 60;
                    return (
                      <Box
                        key={item.day}
                        sx={{
                          flex: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            height,
                            bgcolor: item.isCheapest ? '#FF385C' : '#F7F7F7',
                            borderRadius: '8px',
                            border: item.isCheapest ? 'none' : '2px solid #E0E0E0',
                            mb: 1,
                            transition: 'all 0.3s ease',
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontWeight: item.isCheapest ? 700 : 600,
                            color: item.isCheapest ? '#FF385C' : '#666666',
                          }}
                        >
                          {item.day}
                        </Typography>
                        {item.price ? (
                          <Typography sx={{ fontSize: '10px', color: '#888888' }}>
                            {item.price}
                          </Typography>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>

                <Typography sx={{ fontSize: '14px', color: '#666666' }}>
                  {recommendations.explanations?.cheapestDay ||
                    'Historically, midweek days offer better prices due to lower demand'}
                </Typography>
              </Card>
            </motion.div>

            {recommendations.liveSchedules?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <Card sx={{ p: 4, borderRadius: '20px', mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#666666',
                      mb: 2,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Live occupancy on this date
                  </Typography>
                  <Grid container spacing={2}>
                    {recommendations.liveSchedules.map((trip) => (
                      <Grid item xs={12} sm={6} md={3} key={`${trip.departureTime}-${trip.vehicleType}-${trip.price}`}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            bgcolor: '#F7F7F7',
                            height: '100%',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {trip.vehicleType === 'train' ? (
                              <Train sx={{ fontSize: 18, color: '#FF385C' }} />
                            ) : (
                              <DirectionsBus sx={{ fontSize: 18, color: '#00A699' }} />
                            )}
                            <Typography sx={{ fontWeight: 700, color: '#222222' }}>
                              {trip.departureTime}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '13px', color: '#666666' }}>
                            {trip.occupancyPercent}% full · {trip.booked}/{trip.capacity} seats
                          </Typography>
                          <Typography sx={{ fontSize: '13px', color: '#222222', mt: 0.5 }}>
                            PKR {trip.price}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Box sx={{ textAlign: 'center', mt: 3, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  icon={<TrendingUp />}
                  label={`Powered by ${recommendations.method || 'live occupancy'}`}
                  sx={{
                    bgcolor: '#F7F7F7',
                    color: '#666666',
                    fontWeight: 600,
                    fontSize: '14px',
                    px: 2,
                    height: 36,
                  }}
                />
                {recommendations.sampleSize ? (
                  <Chip
                    label={`${recommendations.sampleSize} trips analysed`}
                    sx={{
                      bgcolor: '#E6FAF8',
                      color: '#00A699',
                      fontWeight: 600,
                      fontSize: '14px',
                      px: 2,
                      height: 36,
                    }}
                  />
                ) : null}
              </Box>
            </motion.div>
          </Box>
        )}
      </Box>
    </AppShell>
  );
};

export default RecommendationsPage;
