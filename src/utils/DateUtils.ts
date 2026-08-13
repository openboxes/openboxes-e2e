import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { DateFormat } from '@/constants/DateFormats';

// required for parseDate to accept non-standard formats like 'D MMMM YYYY hh:mm A'
dayjs.extend(customParseFormat);

const formatDate = (date: Date, format: string = DateFormat.DEFAULT) => {
  return dayjs(date).format(format);
};

const parseDate = (date: string, format: string) => {
  return dayjs(date, format).toDate();
};

const getDateByOffset = (date: Date, offset: number) => {
  const newDate = new Date(date);
  return new Date(newDate.setDate(newDate.getDate() + offset));
};

const getDayOfMonth = (date: Date) => {
  return parseInt(dayjs(date).format('D'));
};

const getToday = () => new Date(new Date().setHours(0, 0, 0, 0));

export { formatDate, getDateByOffset, getDayOfMonth, getToday, parseDate };
