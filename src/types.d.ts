import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';

import { LocationTypeCode } from './constants/LocationTypeCode';
import { ShipmentType } from './constants/ShipmentType';

type TestFixtureProps<T> = T &
  PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions;

/**
 * FIXME: mergeTest workaround
 * We don't have access to util method mergeTests(), this method is only introduced in @1.39.
 * Since we are using node 14 and highes version of playwright
 * that works with this version of node is @1.34,
 * this type should help with exporting fixtures from individual files.
 */
type FixtureCallback<T> = (
  { page }: TestFixtureProps<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use: (arg: any) => Promise<void>
) => Promise<void>;

type ApiResponse<T> = { data: T };

type LocationResponse = {
  id: string;
  name: string;
  locationNumber: string;
  locationGroup: {
    id: string;
    name: string;
  };
  locationType: {
    id: string;
    name: string;
    description: string;
    locationTypeCode: string;
  };
  supportedActivities: string[];
  organization: {
    id: string;
    name: string;
    code: string;
  };
  parentLocation?: string;
};

type CreateLocationPayload = {
  active: boolean;
  name: string;
  locationType?: LocationType;
  organization?: { id: string };
  supportedActivities?: string[] | Set<string>;
};

type LocationType = {
  id: string;
  name: string;
  description: string;
  locationTypeCode: LocationTypeCode;
  supportedActivities: string[];
};

type ProductResponse = {
  id: string;
  productCode: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  pricePerUnit?: number;
  color?: string;
  handlingIcons: unknown[];
  lotAndExpiryControl: boolean;
  active: boolean;
  displayNames: unknown;
};

type DemandResponse = {
  totalDemand: number;
  totalDays: number;
  dailyDemand: number;
  monthlyDemand: number;
  onHandMonths: number;
  quantityOnHand: number;
};

type ProductDemandResponse = {
  product: ProductResponse;
  demand: DemandResponse;
};

type CreateUserType = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
};

type User = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  username: string;
  roles: string[];
};

type AddItemsTableRow = {
  packLevel1: string;
  packLevel2: string;
  productCode: string;
  productName: string;
  lotNumber: string;
  expirationDate: Date;
  quantity: string;
  recipient: string;
};

type CreateStockMovementPayload = {
  name?: string;
  description: string;
  origin: { id: string };
  destination: { id: string };
  requestedBy: { id: string };
  stocklist?: { id: string };
  dateRequested: string;
};

type StockMovementResponse = {
  id: string;
  name: string;
  description: string;
  statusCode: string;
  displayStatus: { name: string; label: string };
  identifier: string;
  origin: {
    id: string;
    name: string;
    locationNumber: string;
    locationType: unknown;
    organizationName: string;
    organizationCode: string;
    isDepot: boolean;
    supportedActivities: unknown[];
  };
  destination: {
    id: string;
    name: string;
    locationNumber: string;
    locationType: unknown;
    organizationName: string;
    organizationCode: string;
    isDepot: boolean;
    supportedActivities: unknown[];
  };
  order: { id: string; name: string; orderNumber: string };
  hasManageInventory: boolean;
  stocklist: { id: string; name: string };
  replenishmentType: string;
  dateRequested: string;
  dateCreated: string;
  dateShipped: string;
  expectedDeliveryDate: string;
  lastUpdated: string;
  shipmentType: string;
  currentStatus: string;
  shipmentStatus: string;
  trackingNumber: string;
  driverName: string;
  comments: string;
  currentEvent: string;
  requestedBy: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    roles: unknown[];
  };
  lineItems: unknown[];
  lineItemCount: number;
  approvers: unknown;
  isFromOrder: boolean;
  isReturn: boolean;
  isShipped: boolean;
  isReceived: boolean;
  isPartiallyReceived: boolean;
  isElectronicType: boolean;
  isPending: boolean;
  shipped: boolean;
  received: boolean;
  requestType: unknown;
  sourceType: unknown;
  picklist: { id: string };
  associations: {
    shipment: {
      id: string;
    };
  };
};

type UpdateStockMovementItemsPayload = {
  id: string;
  lineItems: {
    product: { id: string };
    quantityRequested: string;
    recipient?: { id: string };
    sortOrder: number;
  }[];
};

type UpdateStockMovementStatusPayload = {
  status: 'CHECKING' | 'DISPATCHED';
};

type UpdateStockMovementPayload = {
  comments?: string;
  dateShipped: string;
  driverName?: string;
  expectedDeliveryDate: string;
  shipmentType?: string;
  trackingNumber?: string;
};

type ReceiptResponse = {
  receiptId: string | null;
  receiptStatus: string;
  shipmentId: string;
  shipmentName: string;
  shipmentNumber: string;
  shipmentStatus: string;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  dateShipped: string;
  dateDelivered: string;
  containers: Container[];
  requisition: unknown;
  description: string;
  recipient: Recipient;
  isShipmentFromPurchaseOrder: boolean;
};

type Container = {
  containerId: string | null;
  containerName: string | null;
  parentContainerId: string | null;
  parentContainerName: string | null;
  containerType: string | null;
  shipmentItems: ShipmentItem[];
};

type ContainerInfo = {
  id: string;
  name: string;
  type: string;
};

type ParentContainerInfo = {
  id: string;
  name: string;
};

export type UnflattenContainer = {
  container: ContainerInfo;
  parentContainer: ParentContainerInfo;
  shipmentItems: ShipmentItem[];
};

type ShipmentItem = {
  receiptItemId: string | null;
  shipmentItemId: string;
  containerId: string | null;
  containerName: string | null;
  parentContainerId: string | null;
  parentContainerName: string | null;
  productId: string;
  productCode: string;
  productName: string;
  productDisplayNames: {
    default: string | null;
    fr?: string;
  };
  productLotAndExpiryControl: unknown;
  productHandlingIcons: string[];
  lotNumber: string | null;
  expirationDate: string | null;
  binLocationId: string;
  binLocationName: string;
  binLocationZoneId: string | null;
  binLocationZoneName: string | null;
  recipientId: string | null;
  recipientName: string | null;
  quantityShipped: number;
  quantityReceived: number;
  quantityCanceled: number;
  quantityReceiving: number | null;
  quantityRemaining: number;
  cancelRemaining: boolean;
  quantityOnHand: number;
  comment: string | null;
  unitOfMeasure: string;
  packSize: number;
  packsRequested: number;
  original?: boolean;
  'binLocation.name': string;
};

type Recipient = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  roles: string[];
};

type ReceivingItemPayload = {
  shipmentItemId: string;
  quantityReceiving?: number;
  quantityShipped?: number;
  comment?: string;
  binLocationId?: string;
  lotNumber?: string;
  expirationDate?: string;
  original?: boolean;
  newLine?: boolean;
  receiptItemId?: string | null;
  binLocationName?: string;
};

type ReceiptPayload = Omit<ReceiptResponse, 'containers' | 'recipient'> & {
  containers: UnflattenContainer[];
  recipient: string;
};

type AppContextResponse = {
  location: LocationResponse;
  user: User;
  currentLocationRoles: string[];
};

type CreateInboundPayload = {
  originId: string;
  destinationId?: string;
  description?: string;
  requestorId?: string;
  dateRequested?: Date;
};

type LineItemsPayload = {
  productId: string;
  quantity: number;
  lotNumber?: string;
  expirationDate?: Date;
  palletName?: string;
  boxName?: string;
  recipientId?: string;
}[];

type SendInboundPayload = {
  dateShipped?: Date;
  expectedDeliveryDate?: Date;
  shipmentType: ShipmentType;
};

type CreateInboundAddItemsTableEntity = {
  palletName?: string;
  boxName?: string;
  product: {
    productCode: string;
    productName?: string;
  };
  quantity: number | string;
  lotNumber?: string;
  recipient?: {
    id: string;
    name?: string;
  };
  expirationDate?: Date;
};
