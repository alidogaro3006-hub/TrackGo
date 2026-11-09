import * as yup from 'yup';
import { CITIES } from '../../constants/cities';

export const cities = CITIES;

export const routeSchema = yup.object({
  source: yup.string().required('Source is required'),
  destination: yup
    .string()
    .required('Destination is required')
    .test('different', 'Destination must differ from source', function (value) {
      return value !== this.parent.source;
    }),
});

export const vehicleSchema = yup.object({
  type: yup.string().required('Type is required'),
  capacity: yup
    .number()
    .required('Capacity is required')
    .min(10, 'Minimum capacity is 10')
    .max(500, 'Maximum capacity is 500'),
  registrationNumber: yup.string().required('Registration number is required'),
});

const TIME_24H_REGEX = /^([0-1]\d|2[0-3]):[0-5]\d$/;

export const scheduleSchema = yup.object({
  routeId: yup.string().required('Route is required'),
  vehicleId: yup.string().required('Vehicle is required'),
  date: yup.date().required('Date is required'),
  departureTime: yup
    .string()
    .required('Departure time is required')
    .matches(TIME_24H_REGEX, 'Use 24-hour HH:MM format, e.g. 14:30'),
  arrivalTime: yup
    .string()
    .required('Arrival time is required')
    .matches(TIME_24H_REGEX, 'Use 24-hour HH:MM format, e.g. 14:30'),
  price: yup.number().required('Price is required').min(0, 'Price must be positive'),
});
