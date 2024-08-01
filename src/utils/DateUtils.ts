import dayjs from 'dayjs';

const formatDate = (date: Date, format = 'MM/DD/YYYY') => {
  const kek = new Date();
  kek.getDay();
  return dayjs(date).format(format);
};

const getDateByOffset = (date: Date, offset: number) => {
  const newDate = new Date(date);
  return new Date(newDate.setDate(newDate.getDate() + offset));
};

const getDayOfMonth = (date: Date) => {
  return parseInt(dayjs(date).format('D'));
};

const getToday = () => new Date(new Date().setHours(0, 0, 0, 0));

export { formatDate, getDateByOffset, getDayOfMonth, getToday };
