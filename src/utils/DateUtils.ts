import dayjs from 'dayjs';

const formatDate = (date: Date, format = 'MM/DD/YYYY') => {
  return dayjs(date).format(format);
};

const getDateByOffset = (date: Date, offset: number) => {
  const newDate = new Date(date);
  return new Date(newDate.setDate(newDate.getDate() + offset));
};

export { formatDate, getDateByOffset };
