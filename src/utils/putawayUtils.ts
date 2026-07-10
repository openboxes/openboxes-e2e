import { TestInfo } from '@playwright/test';

import PutawayService from '@/api/PutawayService';

/**
  Deletes the putaway order when it is still pending. Returns true when a
  pending putaway was deleted, false when there was nothing to delete (the
  putaway was completed, or was already removed within the test body).
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
  Shared afterEach cleanup for putaway tests. Extends the hook timeout first (a
  failed test may have used up most of the shared test timeout), then deletes
  every recorded putaway order that is still pending, so a putaway stuck by a
  mid-test failure never leaks to the next test.

  Returns flags describing what the deletes found, so callers can tell whether
  the transactions created by completing a putaway exist and can be removed —
  deleting transaction rows by position after a mid-test failure would peel
  unrelated rows instead.
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
