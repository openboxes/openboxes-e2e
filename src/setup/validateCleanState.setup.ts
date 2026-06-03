import AppConfig from '@/config/AppConfig';
import LocationConfig from '@/config/LocationConfig';
import { StockMovementDirection } from '@/constants/StockMovementDirection';
import { test } from '@/fixtures/fixtures';
import { PutawayCandidate, StockMovementResponse } from '@/types';

/**
 * Leftover putaways or inbound stock movements introduce unexpected rows in the
 * list pages, which make tests pick the wrong row or mismatch quantity
 * assertions. We validate the state here so the suite aborts early with a clear
 * message instead of failing later in a confusing way.
 *
 * Putaways are only created at the main location by the tests, so we only check
 * it there. Inbound stock movements can land at any depot, so we check all
 * configured locations.
 */
function assertNoPutawayCandidates(
  location: LocationConfig,
  candidates: PutawayCandidate[]
) {
  if (candidates.length === 0) {
    return;
  }

  const details = candidates
    .map(
      (candidate) =>
        `${candidate.product?.productCode ?? '?'} ${candidate.product?.name ?? ''} ` +
        `(bin: ${candidate.currentLocation?.name ?? '?'}, qty: ${candidate.quantity ?? '?'}, ` +
        `status: ${candidate.putawayStatus ?? '?'})`
    )
    .join('; ');

  throw new Error(
    `Location "${location.name || location.readId()}" has ${candidates.length} ` +
      `unexpected putaway candidate(s) that must be removed before running tests: ${details}`
  );
}

function assertNoInbounds(
  location: LocationConfig,
  inbounds: StockMovementResponse[]
) {
  if (inbounds.length === 0) {
    return;
  }

  const details = inbounds
    .map((sm) => `${sm.identifier} (${sm.displayStatus?.label ?? sm.statusCode})`)
    .join('; ');

  throw new Error(
    `Location "${location.name || location.readId()}" has ${inbounds.length} ` +
      `unexpected inbound stock movement(s) that must be removed before running tests: ${details}`
  );
}

test('validate clean state', async ({
  putawayService,
  stockMovementService,
}) => {
  // validate there are no putaways waiting at the main location
  const mainLocation = AppConfig.instance.locations['main'];
  const { data: putawayCandidates } =
    await putawayService.getPutawayCandidates(mainLocation.readId());
  assertNoPutawayCandidates(mainLocation, putawayCandidates);

  // validate there are no leftover inbound stock movements at any location
  const locations = Object.values(AppConfig.instance.locations).filter(
    (location) => location?.readId()
  );
  for (const location of locations) {
    const { data: inbounds } = await stockMovementService.getStockMovements({
      direction: StockMovementDirection.INBOUND,
      destination: location.readId(),
    });
    assertNoInbounds(location, inbounds);
  }
});
