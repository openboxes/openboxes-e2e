import path from 'node:path';

import _ from 'lodash';

import RoleType from '@/constants/RoleTypes';
import AppConfig from '@/utils/AppConfig';

class TestUserConfig {
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
    const unexpectedRoles = _.difference(
      [...userRoles],
      [...this.requiredRoles]
    );
    const absentRequiredRoles = _.difference(
      [...this.requiredRoles],
      [...userRoles]
    );

    // throw an exception if user does not have certain roles that are specified as requiredRoles
    if (absentRequiredRoles.length > 0) {
      throw new Error(
        `User "${this.username}" is missing required roles: ${[...absentRequiredRoles].join(', ')}`
      );
    }

    // throwan exeption if user has roles that were not specified as requiredRoles
    if (unexpectedRoles.length > 0) {
      throw new Error(
        `User "${this.username}" has unexpected roles: ${[...unexpectedRoles].join(', ')}`
      );
    }
  }
}

export default TestUserConfig;
