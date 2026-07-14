import { TestInfo } from '@playwright/test';

import PutawayService from '@/api/PutawayService';

/**
  Deletes the putaway order if it is still in PENDING status. Returns true
  when a pending putaway was deleted, false when there was nothing to delete
  (the order was completed or no longer exists).
*/
async function deletePutawayOrderIfPending(
  putawayService: PutawayService,
  putawayOrderId: string
): Promise<boolean> {
  const putaway = await putawayService.getPutaway(putawayOrderId);
  if (putaway?.data?.putawayStatus !== 'PENDING') {
    return false;
  }
  await putawayService.deletePutawayOrder(putawayOrderId);
  return true;
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

  const deletedPendingPutaways = [];
  for (const putawayOrderId of putawayOrderIds) {
    deletedPendingPutaways.push(
      await deletePutawayOrderIfPending(putawayService, putawayOrderId)
    );
  }

  return {
    allPutawaysCompleted:
      putawayOrderIds.length > 0 &&
      deletedPendingPutaways.every((wasPending) => !wasPending),
    anyPutawayCompleted: deletedPendingPutaways.some(
      (wasPending) => !wasPending
    ),
  };
}
