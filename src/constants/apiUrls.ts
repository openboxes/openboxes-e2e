/**
 * Definitions of ENDPOINT URLs used for API calls in e2e tests.
 * URLs are relative to APP_BASE_URL configured in Playwright.
 */

const API = './api';

// AUTH
export const LOGIN_API = `${API}/login`;
export const CHOOSE_LOCATION = (locationId: string) =>
  `${API}/chooseLocation/${locationId}`;

// APP CONTEXT
export const APP_CONTEXT = `${API}/getAppContext`;

// GENERIC
export const GENERIC_API = `${API}/generic`;
export const GENERIC_USER_BY_ID = (id: string) => `${GENERIC_API}/user/${id}`;

// LOCATIONS
export const LOCATION_API = `${API}/locations`;
export const LOCATION_BY_ID = (id: string) => `${LOCATION_API}/${id}`;
export const LOCATION_TYPES = `${LOCATION_API}/locationTypes`;

// STOCK MOVEMENT
export const STOCK_MOVEMENT_API = `${API}/stockMovements`;
export const STOCK_MOVEMENT_API_PATTERN = `${STOCK_MOVEMENT_API}?**`;
export const STOCK_MOVEMENT_ITEMS_PATTERN =
  /\/api\/stockMovements\/.*\/stockMovementItems/;
export const STOCK_MOVEMENT_BY_ID = (id: string) =>
  `${STOCK_MOVEMENT_API}/${id}`;
export const STOCK_MOVEMENT_UPDATE_ITEMS = (id: string) =>
  `${STOCK_MOVEMENT_BY_ID(id)}/updateItems`;
export const STOCK_MOVEMENT_UPDATE_SHIPMENT = (id: string) =>
  `${STOCK_MOVEMENT_BY_ID(id)}/updateShipment`;
export const STOCK_MOVEMENT_STATUS = (id: string) =>
  `${STOCK_MOVEMENT_BY_ID(id)}/status`;
export const STOCK_MOVEMENT_ITEMS = (id: string) =>
  `${STOCK_MOVEMENT_BY_ID(id)}/stockMovementItems`;

// PUTAWAY
export const PUTAWAY_API = `${API}/putaways`;

// PARTIAL RECEIVING
export const PARTIAL_RECEIVING_BY_ID = (id: string) =>
  `${API}/partialReceiving/${id}`;
export const PARTIAL_RECEIVING_API_PATTERN = `${API}/partialReceiving/**`;

// PRODUCTS
export const PRODUCT_API = `${API}/products`;
export const PRODUCT_BY_ID = (id: string) => `${PRODUCT_API}/${id}`;
export const PRODUCT_DEMAND = (id: string) => `${PRODUCT_BY_ID(id)}/demand`;
export const PRODUCT_IMPORT = `${PRODUCT_API}/import`;

// INVENTORY
export const INVENTORY_IMPORT = (facilityId: string) =>
  `${API}/facilities/${facilityId}/inventories/import`;
