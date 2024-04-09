import path from 'node:path';

import RoleType from '@/constants/RoleTypes';

import AppConfig from './AppConfig';

class TestUser {
    username: string;
    password: string;
    storagePath: string;
    requiredRoles: Set<RoleType>;

    constructor(username: string, password: string, storageFileName: string, requiredRoles: Set<RoleType>) {
        this.username = username;
        this.password = password;
        this.storagePath = path.join(AppConfig.AUTH_STORAGE_DIR_PATH, storageFileName);
        this.requiredRoles = requiredRoles;
    }
}

export default TestUser;