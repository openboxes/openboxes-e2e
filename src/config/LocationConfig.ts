import _ from 'lodash';

import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';

class LocationConfig {
  id: string;
  requiredActivityCodes: Set<ActivityCode>;
  requiredType: LocationTypeCode;

  constructor(
    id: string,
    requiredActivityCodes: Set<ActivityCode>,
    requiredType: LocationTypeCode
  ) {
    this.id = id;
    this.requiredActivityCodes = requiredActivityCodes;
    this.requiredType = requiredType;
  }

  assertAllRequiredActivityCodes(activityCodes: Set<string>) {
    const unexpectedActivities = _.difference(
      [...activityCodes],
      [...this.requiredActivityCodes]
    );
    const absentActivities = _.difference(
      [...this.requiredActivityCodes],
      [...activityCodes]
    );

    // throw an exception if location does not have certain activity codes that are specified as requiredActivityCodes
    if (absentActivities.length > 0) {
      throw new Error(
        `Location "${this.id}" is missing required activity codes: ${[...absentActivities].join(', ')}`
      );
    }

    // throwan exeption if location has activity codes that were not specified as requiredActivityCodes
    if (unexpectedActivities.length > 0) {
      throw new Error(
        `Location "${this.id}" has unexpected activity codes: ${[...unexpectedActivities].join(', ')}`
      );
    }
  }

  assertRequiredLocationType(locationType: string) {
    if (locationType !== this.requiredType) {
      throw new Error(
        `Location "${this.id}" has incorrect type: expected "${this.requiredType}" - got: "${locationType}"`
      );
    }
  }
}

export default LocationConfig;
