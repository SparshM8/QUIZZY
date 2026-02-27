const ROLES = {
  STUDENT: 'student',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

const ROLE_LEVELS = {
  [ROLES.STUDENT]: 0,
  [ROLES.MANAGER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3
};

const hasRequiredRole = (userRole, requiredRole) => {
  const userLevel = ROLE_LEVELS[userRole] ?? -1;
  const normalizedRequiredRole = requiredRole === ROLES.ADMIN ? ROLES.MANAGER : requiredRole;
  const requiredLevel = ROLE_LEVELS[normalizedRequiredRole] ?? Number.MAX_SAFE_INTEGER;
  return userLevel >= requiredLevel;
};

const isAdminRole = (role) => hasRequiredRole(role, ROLES.MANAGER);

module.exports = {
  ROLES,
  ROLE_LEVELS,
  hasRequiredRole,
  isAdminRole
};