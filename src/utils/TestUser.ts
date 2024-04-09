import path from 'node:path';

import RoleType from '@/constants/RoleTypes';
import { setDifference } from '@/utils';

import AppConfig from './AppConfig';

class TestUser {
  username: string;
  password: string;
  storagePath: string;
  requiredRoles: Set<RoleType>;

  constructor(
    username: string,
    password: string,
    storageFileName: string,
    requiredRoles: Set<RoleType>
  ) {
    this.username = username;
    this.password = password;
    this.storagePath = path.join(
      AppConfig.AUTH_STORAGE_DIR_PATH,
      storageFileName
    );
    this.requiredRoles = requiredRoles;
  }

  assertAllRequiredRoles(userRoles: Set<string>) {
    const unexpectedRoles = setDifference(userRoles, this.requiredRoles);
    const absentRequiredRoles = setDifference(this.requiredRoles, userRoles);

    // throw an exception if user doe snot have certain roles that are specified as requiredRoles
    if (absentRequiredRoles.size > 0) {
      throw new Error(
        `User is missing required roles: ${[...absentRequiredRoles].join(', ')}`
      );
    }

    // throwan exeption if user has roles that were not specified as requiredRoles
    if (unexpectedRoles.size > 0) {
      throw new Error(
        `User has unexpected roles: ${[...unexpectedRoles].join(', ')}`
      );
    }
  }
}

export default TestUser;
