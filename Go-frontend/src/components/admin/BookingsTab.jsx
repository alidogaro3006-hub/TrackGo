import {
  Box, Card, Typography, Chip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
  FormControl, InputLabel, Select, MenuItem, Grid,
} from '@mui/material';
import { DirectionsBus, Train } from '@mui/icons-material';
import dayjs from 'dayjs';

const statusColor = {
  confirmed: { bg: '#E6FAF8', color: '#00A699' },
  cancelled: { bg: '#FEE2E2', color: '#EF4444' },
  pending: { bg: '#FEF3C7', color: '#F59E0B' },
};

const BookingsTab = ({ bookings, isLoading, statusFilter, onFilterChange, isMobile }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>All Bookings</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isLoading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: '8px' }} />
          ))}
        </Box>
      ) : bookings.length === 0 ? (
        <Card sx={{ p: 4, borderRadius: '16px', textAlign: 'center' }}>
          <Typography sx={{ color: '#666666' }}>No bookings found</Typography>
        </Card>
      ) : isMobile ? (
        <Box>
          {bookings.map((booking) => (
            <Card key={booking._id} sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '14px' }}>
                  {booking.userId?.name || 'Unknown user'}
                </Typography>
                <Chip
                  label={booking.status}
                  size="small"
                  sx={{
                    bgcolor: statusColor[booking.status]?.bg,
                    color: statusColor[booking.status]?.color,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '13px', color: '#666666', mb: 0.5 }}>
                {booking.scheduleId?.routeId?.source} → {booking.scheduleId?.routeId?.destination}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#666666' }}>
                {dayjs(booking.scheduleId?.date).format('MMM DD, YYYY')} · Seats: {booking.seats?.join(', ')} · PKR {booking.totalPrice}
              </Typography>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F7F7F7' }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seats</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking, index) => (
                <TableRow key={booking._id} sx={{ bgcolor: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{booking.userId?.name || 'Unknown'}</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#666666' }}>{booking.userId?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    {booking.scheduleId?.routeId?.source} → {booking.scheduleId?.routeId?.destination}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {booking.scheduleId?.vehicleId?.type === 'bus'
                        ? <DirectionsBus sx={{ color: '#00A699', fontSize: 18 }} />
                        : <Train sx={{ color: '#FF385C', fontSize: 18 }} />}
                      <Typography sx={{ fontSize: '13px' }}>
                        {booking.scheduleId?.vehicleId?.registrationNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{dayjs(booking.scheduleId?.date).format('MMM DD, YYYY')}</TableCell>
                  <TableCell>{booking.seats?.join(', ')}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#FF385C' }}>PKR {booking.totalPrice}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      size="small"
                      sx={{
                        bgcolor: statusColor[booking.status]?.bg,
                        color: statusColor[booking.status]?.color,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BookingsTab;
