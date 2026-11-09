import { useEffect } from 'react';
import {
  Box, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { adminCreateVehicle, adminUpdateVehicle } from '../../api';
import { vehicleSchema } from './constants';

const VehicleDialog = ({ open, mode, data, onClose, onSuccess }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(vehicleSchema),
    defaultValues: {
      type: data?.type || 'bus',
      capacity: data?.capacity || 50,
      registrationNumber: data?.registrationNumber || '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: data?.type || 'bus',
        capacity: data?.capacity || 50,
        registrationNumber: data?.registrationNumber || '',
      });
    }
  }, [open, data, reset]);

  const onSubmit = async (formData) => {
    try {
      const apiCall = mode === 'add'
        ? adminCreateVehicle(formData)
        : adminUpdateVehicle(data._id, formData);
      const response = await apiCall;
      if (response.data.success) {
        toast.success(`Vehicle ${mode === 'add' ? 'created' : 'updated'} successfully`);
        onSuccess();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save vehicle';
      setError('root', { message });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '20px', p: 2, minWidth: 400 } }}>
      <DialogTitle>
        <Typography sx={{ fontWeight: 700, fontSize: '20px' }}>
          {mode === 'add' ? 'Add New Vehicle' : 'Edit Vehicle'}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>Type</InputLabel>
                  <Select {...field} label="Type">
                    <MenuItem value="bus">Bus</MenuItem>
                    <MenuItem value="train">Train</MenuItem>
                  </Select>
                  {errors.type && (
                    <Typography sx={{ color: '#EF4444', fontSize: '12px', mt: 0.5 }}>
                      {errors.type.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
            <Controller
              name="capacity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Capacity"
                  type="number"
                  fullWidth
                  error={!!errors.capacity}
                  helperText={errors.capacity?.message}
                  inputProps={{ min: 10, max: 500 }}
                />
              )}
            />
            <Controller
              name="registrationNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Registration Number"
                  fullWidth
                  error={!!errors.registrationNumber}
                  helperText={errors.registrationNumber?.message}
                />
              )}
            />
            {errors.root && (
              <Typography sx={{ color: '#EF4444', fontSize: '14px' }}>{errors.root.message}</Typography>
            )}
          </Box>
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

export default VehicleDialog;
