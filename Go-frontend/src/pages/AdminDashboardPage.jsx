import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Tabs, Tab, Grid, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Route as RouteIcon,
  DirectionsBus,
  Schedule as ScheduleIcon,
  ConfirmationNumber,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import {
  adminGetRoutes,
  adminGetVehicles,
  adminGetSchedules,
  adminDeleteRoute,
  adminDeleteVehicle,
  adminDeleteSchedule,
  adminGetBookings,
} from '../api';
import RoutesTab from '../components/admin/RoutesTab';
import VehiclesTab from '../components/admin/VehiclesTab';
import SchedulesTab from '../components/admin/SchedulesTab';
import BookingsTab from '../components/admin/BookingsTab';
import RouteDialog from '../components/admin/RouteDialog';
import VehicleDialog from '../components/admin/VehicleDialog';
import ScheduleDialog from '../components/admin/ScheduleDialog';

const AdminDashboardPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingAllSchedules, setIsLoadingAllSchedules] = useState(true);
  const [routeDialog, setRouteDialog] = useState({ open: false, mode: 'add', data: null });
  const [vehicleDialog, setVehicleDialog] = useState({ open: false, mode: 'add', data: null });
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, mode: 'add', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, type: null });
  const [scheduleFilters, setScheduleFilters] = useState({
    source: '', destination: '', date: null, vehicleType: '',
  });
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

  useEffect(() => {
    fetchRoutes();
    fetchVehicles();
    fetchAllSchedules();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [scheduleFilters]);

  useEffect(() => {
    fetchBookings();
  }, [bookingStatusFilter]);

  const fetchRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const response = await adminGetRoutes();
      if (response.data.success) setRoutes(response.data.data.routes || []);
    } catch {
      toast.error('Failed to load routes');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await adminGetVehicles();
      if (response.data.success) setVehicles(response.data.data.vehicles || []);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const fetchAllSchedules = async () => {
    setIsLoadingAllSchedules(true);
    try {
      const response = await adminGetSchedules({});
      if (response.data.success) setAllSchedules(response.data.data.schedules || []);
    } catch {
      toast.error('Failed to load schedule stats');
    } finally {
      setIsLoadingAllSchedules(false);
    }
  };

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const params = {};
      if (scheduleFilters.source) params.source = scheduleFilters.source;
      if (scheduleFilters.destination) params.destination = scheduleFilters.destination;
      if (scheduleFilters.date) params.date = scheduleFilters.date.format('YYYY-MM-DD');
      if (scheduleFilters.vehicleType) params.vehicleType = scheduleFilters.vehicleType;

      const response = await adminGetSchedules(params);
      if (response.data.success) setSchedules(response.data.data.schedules || []);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const params = {};
      if (bookingStatusFilter) params.status = bookingStatusFilter;
      const response = await adminGetBookings(params);
      if (response.data.success) setBookings(response.data.data.bookings || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const deleteHandlers = {
    route: {
      call: adminDeleteRoute,
      label: 'route',
      onSuccess: fetchRoutes,
      fallbackError: 'Failed to delete route. It may still have schedules.',
    },
    vehicle: {
      call: adminDeleteVehicle,
      label: 'vehicle',
      onSuccess: fetchVehicles,
      fallbackError: 'Failed to delete vehicle. It may still have schedules.',
    },
    schedule: {
      call: adminDeleteSchedule,
      label: 'schedule',
      onSuccess: () => { fetchSchedules(); fetchAllSchedules(); },
      fallbackError: 'Failed to delete schedule. There may be active bookings.',
    },
  };

  const handleConfirmDelete = async () => {
    const { id, type } = deleteDialog;
    const handler = deleteHandlers[type];
    setDeleteDialog({ open: false, id: null, type: null });
    try {
      const response = await handler.call(id);
      if (response.data.success) {
        toast.success(`${handler.label.charAt(0).toUpperCase() + handler.label.slice(1)} deleted successfully`);
        handler.onSuccess();
      }
    } catch (error) {
      const message = error.response?.data?.message || handler.fallbackError;
      toast.error(message);
    }
  };

  const stats = {
    totalRoutes: routes.length,
    totalVehicles: vehicles.length,
    totalSchedules: allSchedules.length,
    schedulesToday: allSchedules.filter(
      (s) => dayjs(s.date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length,
  };

  const statCards = [
    { label: 'Total Routes', value: stats.totalRoutes, color: '#FF385C', bg: '#FFF0F3', border: '#FFE4E6', icon: <RouteIcon sx={{ color: 'white', fontSize: 24 }} />, loading: isLoadingRoutes },
    { label: 'Total Vehicles', value: stats.totalVehicles, color: '#00A699', bg: '#E6FAF8', border: '#B2F5EA', icon: <DirectionsBus sx={{ color: 'white', fontSize: 24 }} />, loading: isLoadingVehicles },
    { label: 'Total Schedules', value: stats.totalSchedules, color: '#3B82F6', bg: '#F0F9FF', border: '#BFDBFE', icon: <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />, loading: isLoadingAllSchedules },
    { label: 'Schedules Today', value: stats.schedulesToday, color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', icon: <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />, loading: isLoadingAllSchedules },
  ];

  return (
    <AppShell pageTitle="Admin Panel">
      <Box sx={{ maxWidth: '1600px', mx: 'auto' }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <Card sx={{ p: 3, borderRadius: '16px', bgcolor: card.bg, border: `2px solid ${card.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#666666', fontWeight: 600 }}>
                      {card.label}
                    </Typography>
                    {card.loading ? (
                      <Skeleton width={40} height={32} />
                    ) : (
                      <Typography sx={{ fontSize: '28px', fontWeight: 800, color: card.color }}>
                        {card.value}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            <Tabs
              orientation={isMobile ? 'horizontal' : 'vertical'}
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                borderRight: isMobile ? 0 : 1,
                borderBottom: isMobile ? 1 : 0,
                borderColor: 'divider',
                minWidth: isMobile ? 'auto' : 200,
                bgcolor: '#F7F7F7',
                p: isMobile ? 1 : 2,
              }}
            >
              <Tab label="Routes" icon={<RouteIcon />} iconPosition="start" sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 48, fontWeight: 600 }} />
              <Tab label="Vehicles" icon={<DirectionsBus />} iconPosition="start" sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 48, fontWeight: 600 }} />
              <Tab label="Schedules" icon={<ScheduleIcon />} iconPosition="start" sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 48, fontWeight: 600 }} />
              <Tab label="Bookings" icon={<ConfirmationNumber />} iconPosition="start" sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 48, fontWeight: 600 }} />
            </Tabs>

            <Box sx={{ flex: 1, p: 3 }}>
              {activeTab === 0 && (
                <RoutesTab
                  routes={routes}
                  isLoading={isLoadingRoutes}
                  onOpenDialog={(data) => setRouteDialog({ open: true, mode: data ? 'edit' : 'add', data })}
                  onDelete={(id) => setDeleteDialog({ open: true, id, type: 'route' })}
                  isMobile={isMobile}
                />
              )}
              {activeTab === 1 && (
                <VehiclesTab
                  vehicles={vehicles}
                  isLoading={isLoadingVehicles}
                  onOpenDialog={(data) => setVehicleDialog({ open: true, mode: data ? 'edit' : 'add', data })}
                  onDelete={(id) => setDeleteDialog({ open: true, id, type: 'vehicle' })}
                  isMobile={isMobile}
                />
              )}
              {activeTab === 2 && (
                <SchedulesTab
                  schedules={schedules}
                  isLoading={isLoadingSchedules}
                  onOpenDialog={(data) => setScheduleDialog({ open: true, mode: data ? 'edit' : 'add', data })}
                  onDelete={(id) => setDeleteDialog({ open: true, id, type: 'schedule' })}
                  filters={scheduleFilters}
                  onFilterChange={setScheduleFilters}
                  isMobile={isMobile}
                />
              )}
              {activeTab === 3 && (
                <BookingsTab
                  bookings={bookings}
                  isLoading={isLoadingBookings}
                  statusFilter={bookingStatusFilter}
                  onFilterChange={setBookingStatusFilter}
                  isMobile={isMobile}
                />
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      <RouteDialog
        open={routeDialog.open}
        mode={routeDialog.mode}
        data={routeDialog.data}
        onClose={() => setRouteDialog({ open: false, mode: 'add', data: null })}
        onSuccess={() => { setRouteDialog({ open: false, mode: 'add', data: null }); fetchRoutes(); }}
      />
      <VehicleDialog
        open={vehicleDialog.open}
        mode={vehicleDialog.mode}
        data={vehicleDialog.data}
        onClose={() => setVehicleDialog({ open: false, mode: 'add', data: null })}
        onSuccess={() => { setVehicleDialog({ open: false, mode: 'add', data: null }); fetchVehicles(); }}
      />
      <ScheduleDialog
        open={scheduleDialog.open}
        mode={scheduleDialog.mode}
        data={scheduleDialog.data}
        routes={routes}
        vehicles={vehicles}
        onClose={() => setScheduleDialog({ open: false, mode: 'add', data: null })}
        onSuccess={() => { setScheduleDialog({ open: false, mode: 'add', data: null }); fetchSchedules(); fetchAllSchedules(); }}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, type: null })}
        PaperProps={{ sx: { borderRadius: '20px', p: 2 } }}
      >
        <DialogTitle>
          <Typography sx={{ fontWeight: 700, fontSize: '20px', textTransform: 'capitalize' }}>
            Delete {deleteDialog.type}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#666666' }}>
            Are you sure you want to delete this {deleteDialog.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, type: null })} sx={{ color: '#666666' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default AdminDashboardPage;
