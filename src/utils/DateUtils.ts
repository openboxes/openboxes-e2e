const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const getDateByOffset = (date: Date, offset: number) => {
  const newDate = new Date(date);
  return new Date(newDate.setDate(newDate.getDate() + offset));
};

export { formatDate, getDateByOffset };
