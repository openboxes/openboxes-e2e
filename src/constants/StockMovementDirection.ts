export const StockMovementDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;

export type StockMovementDirection =
  (typeof StockMovementDirection)[keyof typeof StockMovementDirection];
