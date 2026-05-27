/**
 * Definitions of APPLICATION URLs used for navigating to pages.
 * URLs are relative to APP_BASE_URL configured in Playwright.
 */

const AUTH_URL = {
  base: './auth',
  login: () => `${AUTH_URL.base}/login`,
};

const DASHBOARD_URL = {
  base: './dashboard',
};

const LOCATION_URL = {
  base: './location',
  list: () => `${LOCATION_URL.base}/list`,
  edit: () => `${LOCATION_URL.base}/edit`,
};

const LOCATION_GROUP_URL = {
  base: './locationGroup',
  list: (params: { max: number }) =>
    `${LOCATION_GROUP_URL.base}/list?max=${params.max}`,
};

const PRODUCT_URL = {
  base: './product',
  create: () => `${PRODUCT_URL.base}/create`,
  createPattern: '**/product/create**',
  edit: (id: string) => `${PRODUCT_URL.base}/edit/${id}`,
};

const INVENTORY_ITEM_URL = {
  base: './inventoryItem',
  showStockCard: (id: string) => `${INVENTORY_ITEM_URL.base}/showStockCard/${id}`,
};

const STOCK_MOVEMENT_URL = {
  base: './stockMovement',
  list: () => `${STOCK_MOVEMENT_URL.base}/list`,
  listPattern: '**/stockMovement/list**',
  listInbound: () => `${STOCK_MOVEMENT_URL.list()}?direction=INBOUND`,
  createInbound: () => `${STOCK_MOVEMENT_URL.base}/createInbound`,
  editInbound: (id: string) => `${STOCK_MOVEMENT_URL.createInbound()}/${id}`,
  show: (id: string) => `${STOCK_MOVEMENT_URL.base}/show/${id}`,
  showPattern: '**/stockMovement/show/**',
};

const INVOICE_URL = {
  base: './invoice',
  list: () => `${INVOICE_URL.base}/list`,
  create: () => `${INVOICE_URL.base}/create`,
};

const ORGANIZATION_URL = {
  base: './organization',
  create: () => `${ORGANIZATION_URL.base}/create`,
};

const PERSON_URL = {
  base: './person',
  list: () => `${PERSON_URL.base}/list`,
};

const USER_URL = {
  base: './user',
  list: () => `${USER_URL.base}/list`,
};

const PUTAWAY_URL = {
  base: './putAway',
  create: () => `${PUTAWAY_URL.base}/create`,
};

const ORDER_URL = {
  base: './order',
  list: () => `${ORDER_URL.base}/list`,
  putawayList: (status: string) =>
    `${ORDER_URL.list()}?orderType=PUTAWAY_ORDER&status=${status}`,
};

export {
  AUTH_URL,
  DASHBOARD_URL,
  INVENTORY_ITEM_URL,
  INVOICE_URL,
  LOCATION_GROUP_URL,
  LOCATION_URL,
  ORDER_URL,
  ORGANIZATION_URL,
  PERSON_URL,
  PRODUCT_URL,
  PUTAWAY_URL,
  STOCK_MOVEMENT_URL,
  USER_URL,
};
