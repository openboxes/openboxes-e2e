export const setDifference = (A: Set<unknown>, B: Set<unknown>) => new Set([...A].filter(x => !B.has(x)))


export const assertAllRequiredRoles = (userRoles: Set<string>, requiredRoles: Set<string>) => {
    const unexpectedRoles = setDifference(userRoles, requiredRoles);
    const absentRequiredRoles = setDifference(requiredRoles, userRoles);
    
    // throw an exception if user doe snot have certain roles that are specified as requiredRoles
    if (absentRequiredRoles.size > 0) {
        throw new Error(`User is missing required roles: ${[...absentRequiredRoles].join(', ')}`)
    }

    // throwan exeption if user has roles that were not specified as requiredRoles
    if (unexpectedRoles.size > 0) {
        throw new Error(`User has unexpected roles: ${[...unexpectedRoles].join(', ')}`)
    }
}
  