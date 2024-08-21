import path from 'node:path';

import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import RoleType from '@/constants/RoleTypes';
import { readFile } from '@/utils/FileIOUtils';

class TestUserConfig {
  id: string;
  key: string;
  username: string;
  password: string;
  storagePath: string;
  requiredRoles: Set<RoleType>;

  constructor({
    key,
    username,
    password,
    storageFileName,
    requiredRoles,
  }: {
    key: string;
    username: string;
    password: string;
    storageFileName: string;
    requiredRoles: Set<RoleType>;
  }) {
    this.id = '';
    this.key = key;
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

  /**
   * Returns a user Id either from
   * @returns
   */
  readId() {
    if (this.id) {
      return this.id;
    }
    const data = readFile(AppConfig.TEST_DATA_FILE_PATH);
    return _.get(data, `users.${this.key}`) as string;
  }
}

export default TestUserConfig;
