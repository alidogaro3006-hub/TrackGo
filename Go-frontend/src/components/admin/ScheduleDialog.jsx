import { useEffect } from 'react';
import {
  Box, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { adminCreateSchedule, adminUpdateSchedule } from '../../api';
import { scheduleSchema } from './constants';

const ScheduleDialog = ({ open, mode, data, routes, vehicles, onClose, onSuccess }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(scheduleSchema),
    defaultValues: {
      routeId: data?.routeId?._id || '',
      vehicleId: data?.vehicleId?._id || '',
      date: data?.date ? dayjs(data.date) : dayjs(),
      departureTime: data?.departureTime || '',
      arrivalTime: data?.arrivalTime || '',
      price: data?.price || 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        routeId: data?.routeId?._id || '',
        vehicleId: data?.vehicleId?._id || '',
        date: data?.date ? dayjs(data.date) : dayjs(),
        departureTime: data?.departureTime || '',
        arrivalTime: data?.arrivalTime || '',
        price: data?.price || 0,
      });
    }
  }, [open, data, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = { ...formData, date: dayjs(formData.date).format('YYYY-MM-DD') };
      const apiCall = mode === 'add'
        ? adminCreateSchedule(payload)
        : adminUpdateSchedule(data._id, payload);
      const response = await apiCall;
      if (response.data.success) {
        toast.success(`Schedule ${mode === 'add' ? 'created' : 'updated'} successfully`);
        onSuccess();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save schedule';
      setError('root', { message });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '20px', p: 2, minWidth: 500 } }}>
      <DialogTitle>
        <Typography sx={{ fontWeight: 700, fontSize: '20px' }}>
          {mode === 'add' ? 'Add New Schedule' : 'Edit Schedule'}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="routeId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.routeId}>
                    <InputLabel>Route</InputLabel>
                    <Select {...field} label="Route">
                      {routes.map((route) => (
                        <MenuItem key={route._id} value={route._id}>
                          {route.source} → {route.destination}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.routeId && (
                      <Typography sx={{ color: '#EF4444', fontSize: '12px', mt: 0.5 }}>
                        {errors.routeId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                name="vehicleId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.vehicleId}>
                    <InputLabel>Vehicle</InputLabel>
                    <Select {...field} label="Vehicle">
                      {vehicles.map((vehicle) => (
                        <MenuItem key={vehicle._id} value={vehicle._id}>
                          {vehicle.type.toUpperCase()} - {vehicle.registrationNumber}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.vehicleId && (
                      <Typography sx={{ color: '#EF4444', fontSize: '12px', mt: 0.5 }}>
                        {errors.vehicleId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Date"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.date,
                        helperText: errors.date?.message,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name="departureTime"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Departure Time"
                    placeholder="e.g. 14:30 (24-hour)"
                    fullWidth
                    error={!!errors.departureTime}
                    helperText={errors.departureTime?.message}
                  />
                )}
              />
              <Controller
                name="arrivalTime"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Arrival Time"
                    placeholder="e.g. 16:45 (24-hour)"
                    fullWidth
                    error={!!errors.arrivalTime}
                    helperText={errors.arrivalTime?.message}
                  />
                )}
              />
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price (PKR)"
                    type="number"
                    fullWidth
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    inputProps={{ min: 0 }}
                  />
                )}
              />
              {errors.root && (
                <Typography sx={{ color: '#EF4444', fontSize: '14px' }}>{errors.root.message}</Typography>
              )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} sx={{ color: '#666666' }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}
            sx={{ bgcolor: '#FF385C', '&:hover': { bgcolor: '#E31C5F' } }}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ScheduleDialog;
