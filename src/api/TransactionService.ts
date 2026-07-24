import BaseServiceModel from '@/api/BaseServiceModel';
import { INVENTORY_URL } from '@/constants/applicationUrls';

/**
  OpenBoxes has no REST endpoints for inventory transactions, so this service
  goes through the same session-authenticated Grails controller actions as
  the transaction list UI (plain GET requests).
*/
class TransactionService extends BaseServiceModel {
  /**
    Returns ids of the most recent transactions in the current location
    (newest first, the same order as the transaction list page), scraped
    from the delete links on the list page.
  */
  async getRecentTransactionIds(count: number): Promise<string[]> {
    const response = await this.request.get(
      INVENTORY_URL.listTransactions({ max: count })
    );
    if (!response.ok()) {
      throw new Error(
        `Problem fetching transaction list: ${response.status()}`
      );
    }
    const html = await response.text();
    return [...html.matchAll(/deleteTransaction\/(\w+)/g)].map(
      (match) => match[1]
    );
  }

  /**
    Deletes a single transaction. A successful delete redirects back to the
    transaction list, a failed one to the edit transaction page.
  */
  async deleteTransaction(id: string): Promise<void> {
    const response = await this.request.get(
      INVENTORY_URL.deleteTransaction(id)
    );
    if (!response.ok() || !response.url().includes('listTransactions')) {
      throw new Error(`Problem deleting transaction with id: ${id}`);
    }
  }

  /**
    Deletes the given number of most recent transactions in the current
    location — the API counterpart of deleting the top rows on the
    transaction list page one by one.
  */
  async deleteRecentTransactions(count: number): Promise<void> {
    const transactionIds = await this.getRecentTransactionIds(count);
    if (transactionIds.length < count) {
      throw new Error(
        `Expected at least ${count} transactions to delete, found ${transactionIds.length}`
      );
    }
    for (const transactionId of transactionIds) {
      await this.deleteTransaction(transactionId);
    }
  }
}

export default TransactionService;
