import BaseServiceModel from '@/api/BaseServiceModel';
import { INVENTORY_IMPORT } from '@/constants/apiUrls';
import { MIGRATION_URL } from '@/constants/applicationUrls';
import { jsonToCsv } from '@/utils/ServiceUtils';

class InventoryService extends BaseServiceModel {
  async importInventories(data: Record<string, string>[], facilityId: string): Promise<void> {
    try {
      const csvContent = jsonToCsv(data);

      const response = await this.request.post(INVENTORY_IMPORT(facilityId), {
        data: csvContent,
        headers: { 'Content-Type': 'text/csv' },
      });

      if (!response.ok()) {
        throw new Error(`Import failed with status ${response.status()}: ${await response.text()}`);
      }
    } catch (error) {
      throw new Error(`Problem importing inventories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
    Recalculates product_availability for a location from the transaction
    ledger. product_availability is a denormalized cache read by several
    features (e.g. putaway candidates), so it can go stale relative to the
    ledger after certain operations are rolled back; this is the app's own
    admin action for reconciling it.
  */
  async refreshProductAvailability(locationId: string) {
    const apiResponse = await this.request.post(
      MIGRATION_URL.refreshProductAvailability(locationId)
    );
    if (!apiResponse.ok()) {
      throw new Error(
        `Problem refreshing product availability for location: ${locationId}`
      );
    }
  }
}

export default InventoryService;
