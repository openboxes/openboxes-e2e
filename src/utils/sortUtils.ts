/*
  Case-insensitive ascending comparator by `name`. Mirrors the backend's
  lexicographic (toLowerCase) ordering used for products and bin locations.
*/
export const byNameAsc = (a: { name: string }, b: { name: string }) => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  if (aName < bName) {
    return -1;
  }

  if (aName > bName) {
    return 1;
  }

  return 0;
};
