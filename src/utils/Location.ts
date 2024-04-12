import _ from 'lodash';

import { ActivityCode } from '@/constants/ActivityCodes';

class Location {
  id: string;
  requiredActivityCodes: Set<ActivityCode>;

  locationType!: string;
  organization?: { id: string; name: string };
  name!: string;

  constructor(id: string, requiredActivityCodes: Set<ActivityCode>) {
    this.id = id;
    this.requiredActivityCodes = requiredActivityCodes;
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
        `Location "${this.name}" is missing required activity codes: ${[...absentActivities].join(', ')}`
      );
    }

    // throwan exeption if location has activity codes that were not specified as requiredActivityCodes
    if (unexpectedActivities.length > 0) {
      throw new Error(
        `Location "${this.name}" has unexpected activity codes: ${[...unexpectedActivities].join(', ')}`
      );
    }
  }
}

export default Location;
