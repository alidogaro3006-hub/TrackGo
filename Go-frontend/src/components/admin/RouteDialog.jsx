import { useEffect } from 'react';
import {
  Box, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { adminCreateRoute, adminUpdateRoute } from '../../api';
import { cities, routeSchema } from './constants';

const RouteDialog = ({ open, mode, data, onClose, onSuccess }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(routeSchema),
    defaultValues: { source: data?.source || '', destination: data?.destination || '' },
  });

  useEffect(() => {
    if (open) {
      reset({ source: data?.source || '', destination: data?.destination || '' });
    }
  }, [open, data, reset]);

  const onSubmit = async (formData) => {
    try {
      const apiCall = mode === 'add'
        ? adminCreateRoute(formData)
        : adminUpdateRoute(data._id, formData);
      const response = await apiCall;
      if (response.data.success) {
        toast.success(`Route ${mode === 'add' ? 'created' : 'updated'} successfully`);
        onSuccess();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save route';
      setError('root', { message });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '20px', p: 2, minWidth: 400 } }}>
      <DialogTitle>
        <Typography sx={{ fontWeight: 700, fontSize: '20px' }}>
          {mode === 'add' ? 'Add New Route' : 'Edit Route'}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={cities}
                  onChange={(e, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Source" error={!!errors.source} helperText={errors.source?.message} />
                  )}
                />
              )}
            />
            <Controller
              name="destination"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={cities}
                  onChange={(e, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Destination" error={!!errors.destination} helperText={errors.destination?.message} />
                  )}
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

export default RouteDialog;
