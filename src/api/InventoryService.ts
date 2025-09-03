import BaseServiceModel from '@/api/BaseServiceModel';
import { jsonToCsv } from '@/utils/ServiceUtils';

class InventoryService extends BaseServiceModel {
  async importInventories(data: Record<string, string>[], locationId: string): Promise<void> {
    try {
      const csvContent = jsonToCsv(data);

      const response = await this.request.post(`./api/locations/${locationId}/inventories/import`, {
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
}

export default InventoryService;
