export const setDifference = (A: Set<unknown>, B: Set<unknown>) =>
  new Set([...A].filter((x) => !B.has(x)));
