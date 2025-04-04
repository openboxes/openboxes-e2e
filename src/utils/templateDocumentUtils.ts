import { CreateInboundAddItemsTableEntity } from '@/types';
import { formatDate } from '@/utils/DateUtils';

export const transformJsonToArrayTemplateRow = (
  row: CreateInboundAddItemsTableEntity,
  id?: string
) => {
  return [
    id || '',
    row.product?.productCode || '',
    row.product?.productName || '',
    row.palletName || '',
    row.boxName|| '',
    row.lotNumber || '',
    row.expirationDate ? formatDate(row.expirationDate) : '',
    row.quantity,
    row.recipient?.id || '',
  ];
};
