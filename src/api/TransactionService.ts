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
  /**
    Deletes every recent transaction that belongs to one of the given orders
    (e.g. putaway numbers like "P-887NMH"). Completing a putaway creates a
    Transfer Out + Transfer In pair per line, and how many pairs depends on
    the putaway lines, so counting "the N newest" rows is fragile; the
    transaction details page names its order, which lets us match exactly.

    Deleting one side of a local transfer can remove its pair as well, so a
    transaction that no longer shows its order number is simply skipped.
  */
  async deleteTransactionsForOrders(
    orderNumbers: string[],
    scanCount = 30
  ): Promise<void> {
    if (orderNumbers.length === 0) {
      return;
    }
    const transactionIds = await this.getRecentTransactionIds(scanCount);
    for (const transactionId of transactionIds) {
      const response = await this.request.get(
        INVENTORY_URL.showTransaction(transactionId)
      );
      if (!response.ok()) {
        continue;
      }
      const html = await response.text();
      const belongsToOrder = orderNumbers.some((orderNumber) =>
        new RegExp(`\\b${orderNumber}\\b`).test(html)
      );
      if (belongsToOrder) {
        await this.deleteTransaction(transactionId);
      }
    }
  }

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
