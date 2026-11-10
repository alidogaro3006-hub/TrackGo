import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, Grid,
  FormControl, InputLabel, Select, MenuItem,
  TextField, TablePagination,
} from '@mui/material';
import { Edit, Delete, Add, DirectionsBus, Train } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { Autocomplete } from '@mui/material';
import dayjs from 'dayjs';
import { cities } from './constants';

const SchedulesTab = ({ schedules, isLoading, onOpenDialog, onDelete, filters, onFilterChange, isMobile }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    setPage(0);
  }, [schedules]);

  const visibleSchedules = schedules.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const pagination = (
    <TablePagination
      component="div"
      count={schedules.length}
      page={page}
      onPageChange={(e, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      rowsPerPageOptions={[10, 25, 50, 100]}
    />
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Manage Schedules</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => onOpenDialog(null)}
          sx={{ bgcolor: '#FF385C', '&:hover': { bgcolor: '#E31C5F' }, borderRadius: '12px' }}
        >
          Add New
        </Button>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              value={filters.source}
              onChange={(e, newValue) => onFilterChange({ ...filters, source: newValue || '' })}
              options={cities}
              renderInput={(params) => <TextField {...params} label="Source" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              value={filters.destination}
              onChange={(e, newValue) => onFilterChange({ ...filters, destination: newValue || '' })}
              options={cities}
              renderInput={(params) => <TextField {...params} label="Destination" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Date"
              value={filters.date}
              onChange={(newValue) => onFilterChange({ ...filters, date: newValue })}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={filters.vehicleType}
                label="Vehicle Type"
                onChange={(e) => onFilterChange({ ...filters, vehicleType: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="bus">Bus</MenuItem>
                <MenuItem value="train">Train</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </LocalizationProvider>

      {isLoading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: '8px' }} />
          ))}
        </Box>
      ) : isMobile ? (
        <Box>
          {visibleSchedules.map((schedule) => (
            <Card key={schedule._id} sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '16px', mb: 0.5 }}>
                  {schedule.routeId?.source} → {schedule.routeId?.destination}
                </Typography>
                <Chip
                  label={schedule.vehicleId?.type}
                  size="small"
                  icon={
                    schedule.vehicleId?.type === 'bus'
                      ? <DirectionsBus sx={{ fontSize: 16 }} />
                      : <Train sx={{ fontSize: 16 }} />
                  }
                  sx={{
                    bgcolor: schedule.vehicleId?.type === 'bus' ? '#00A699' : '#FF385C',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: '11px', color: '#666666' }}>Date</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                    {dayjs(schedule.date).format('MMM DD, YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: '11px', color: '#666666' }}>Time</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                    {schedule.departureTime} - {schedule.arrivalTime}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: '11px', color: '#666666' }}>Price</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#FF385C' }}>
                    PKR {schedule.price}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ fontSize: '11px', color: '#666666' }}>Seats</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                    {schedule.bookedSeats?.length || 0}/{schedule.vehicleId?.capacity}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => onOpenDialog(schedule)} sx={{ color: '#FF385C' }}>
                  <Edit />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(schedule._id)} sx={{ color: '#EF4444' }}>
                  <Delete />
                </IconButton>
              </Box>
            </Card>
          ))}
          {pagination}
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F7F7F7' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Departure</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Arrival</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Booked/Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleSchedules.map((schedule, index) => (
                  <TableRow key={schedule._id} sx={{ bgcolor: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                        {schedule.routeId?.source} → {schedule.routeId?.destination}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {schedule.vehicleId?.type === 'bus'
                          ? <DirectionsBus sx={{ color: '#00A699', fontSize: 18 }} />
                          : <Train sx={{ color: '#FF385C', fontSize: 18 }} />}
                        <Typography sx={{ fontSize: '13px' }}>
                          {schedule.vehicleId?.registrationNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{schedule.departureTime}</TableCell>
                    <TableCell>{schedule.arrivalTime}</TableCell>
                    <TableCell>{dayjs(schedule.date).format('MMM DD, YYYY')}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#FF385C' }}>
                        PKR {schedule.price}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {schedule.bookedSeats?.length || 0}/{schedule.vehicleId?.capacity}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => onOpenDialog(schedule)} sx={{ color: '#FF385C' }}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => onDelete(schedule._id)} sx={{ color: '#EF4444' }}>
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {pagination}
        </>
      )}
    </Box>
  );
};

export default SchedulesTab;
