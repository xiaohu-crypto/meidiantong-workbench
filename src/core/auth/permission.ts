/* ===== 角色权限（复刻NocoBase Roles/Permissions，本地单用户形态）=====
 * 本地应用默认单用户"所有者"角色，但保留完整权限模型接口：
 * 数据范围（全部/本人）、操作权限（增删改查）、字段权限。
 * 当前实现为配置骨架 + 默认全权限，供未来多用户/企业版扩展。
 */

export type RoleName = "owner" | "admin" | "member" | "reader";

export interface Role {
  name: RoleName;
  label: string;
  /** 数据范围 */
  dataScope: "all" | "own";
  /** 操作权限 */
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canRead: boolean;
  /** 字段级权限：字段名 -> 是否可见可编辑 */
  fieldPermissions?: Record<string, { visible: boolean; editable: boolean }>;
  /** 集合级权限：collection -> 是否可用 */
  collectionPermissions?: Record<string, boolean>;
}

/** 内置角色 */
const ROLES: Record<RoleName, Role> = {
  owner: { name: "owner", label: "所有者", dataScope: "all", canCreate: true, canUpdate: true, canDelete: true, canRead: true },
  admin: { name: "admin", label: "管理员", dataScope: "all", canCreate: true, canUpdate: true, canDelete: true, canRead: true },
  member: { name: "member", label: "成员", dataScope: "own", canCreate: true, canUpdate: true, canDelete: false, canRead: true },
  reader: { name: "reader", label: "只读", dataScope: "own", canCreate: false, canUpdate: false, canDelete: false, canRead: true },
};

/** 当前角色（本地单用户固定为所有者，可持久化到settings） */
let currentRole: RoleName = "owner";

export function setCurrentRole(role: RoleName): void {
  currentRole = role;
}

export function getCurrentRole(): RoleName {
  return currentRole;
}

export function getRole(role: RoleName = currentRole): Role {
  return ROLES[role] ?? ROLES.owner;
}

/** 检查操作权限 */
export function can(operation: "create" | "update" | "delete" | "read", collection?: string): boolean {
  const role = getRole();
  if (collection && role.collectionPermissions && role.collectionPermissions[collection] === false) return false;
  switch (operation) {
    case "create": return role.canCreate;
    case "update": return role.canUpdate;
    case "delete": return role.canDelete;
    case "read": return role.canRead;
    default: return true;
  }
}

/** 检查字段权限（默认可见可编辑） */
export function canEditField(field: string, role: Role = getRole()): boolean {
  const fp = role.fieldPermissions?.[field];
  return fp ? fp.editable : true;
}

/** 列出全部角色 */
export function listRoles(): Role[] {
  return Object.values(ROLES);
}
