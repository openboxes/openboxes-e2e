import { TestInfo } from '@playwright/test';

import PutawayService from '@/api/PutawayService';

/**
  Deletes the putaway order if it is still in PENDING status. Returns whether
  a pending putaway was deleted, and the putaway number of an order that was
  not pending (completed), so its transactions can be cleaned up.
*/
async function deletePutawayOrderIfPending(
  putawayService: PutawayService,
  putawayOrderId: string
): Promise<{ wasPending: boolean; completedPutawayNumber: string | null }> {
  const putaway = await putawayService.getPutaway(putawayOrderId);
  if (putaway?.data?.putawayStatus !== 'PENDING') {
    return {
      wasPending: false,
      completedPutawayNumber: putaway?.data?.putawayNumber ?? null,
    };
  }
  await putawayService.deletePutawayOrder(putawayOrderId);
  return { wasPending: true, completedPutawayNumber: null };
}

/**
  Shared afterEach cleanup for putaway tests: extends the hook timeout to
  leave room for the cleanup itself, then deletes every recorded putaway
  order that is still pending.

  Returns flags describing whether the putaways had already been completed,
  so callers know whether the side effects of completing a putaway (e.g.
  transactions) exist and need their own cleanup.
*/
export async function cleanupPendingPutaways({
  putawayService,
  putawayOrderIds,
  testInfo,
}: {
  putawayService: PutawayService;
  putawayOrderIds: string[];
  testInfo: TestInfo;
}) {
  testInfo.setTimeout(testInfo.timeout + 60_000);

  const deletedPendingPutaways: boolean[] = [];
  const completedPutawayNumbers: string[] = [];
  for (const putawayOrderId of putawayOrderIds) {
    const { wasPending, completedPutawayNumber } =
      await deletePutawayOrderIfPending(putawayService, putawayOrderId);
    deletedPendingPutaways.push(wasPending);
    if (completedPutawayNumber) {
      completedPutawayNumbers.push(completedPutawayNumber);
    }
  }

  return {
    allPutawaysCompleted:
      putawayOrderIds.length > 0 &&
      deletedPendingPutaways.every((wasPending) => !wasPending),
    anyPutawayCompleted: deletedPendingPutaways.some(
      (wasPending) => !wasPending
    ),
    // pass to transactionService.deleteTransactionsForOrders to remove the
    // transfer transactions those completed putaways created
    completedPutawayNumbers,
  };
}
