/* ===== 角色权限页（复刻NocoBase Roles，本地单用户形态）=====
 * 查看/切换角色，查看权限矩阵。默认"所有者"全权限。
 */

import { useEffect, useState } from "react";
import { getRole, listRoles, setCurrentRole, type RoleName } from "../core/auth/permission";
import { useT } from "../core/i18n/useT";
import { Btn, Chip } from "../ui/common";
import { db } from "../db/db";

export default function RolesPage() {
  const t = useT();
  const [current, setCurrent] = useState<RoleName>("owner");
  const roles = listRoles();

  useEffect(() => {
    void db.getSetting<RoleName>("role", "owner").then((r) => { setCurrent(r); setCurrentRole(r); });
  }, []);

  async function switchRole(role: RoleName) {
    setCurrent(role);
    setCurrentRole(role);
    await db.setSetting("role", role);
  }

  const permLabels: { key: "canCreate" | "canUpdate" | "canDelete" | "canRead"; label: string }[] = [
    { key: "canCreate", label: t("auth.canCreate") },
    { key: "canUpdate", label: t("auth.canUpdate") },
    { key: "canDelete", label: t("auth.canDelete") },
    { key: "canRead", label: t("auth.canRead") },
  ];

  return (
    <div className="page page-roles">
      <div className="h-row">
        <span className="h-title">{t("auth.title")}</span>
        <Chip kind="data">当前：{getRole(current).label}</Chip>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>
        本地工作台默认"所有者"角色（全部数据权限）。权限模型已预留，支持未来多用户扩展。
      </p>

      <div className="roles-list">
        {roles.map((r) => (
          <div key={r.name} className={"role-card" + (r.name === current ? " active" : "")}>
            <div className="role-head">
              <span className="role-name">{r.label}</span>
              {r.name === current ? <Chip kind="brand">当前角色</Chip> : null}
            </div>
            <div className="role-scope">
              数据范围：{r.dataScope === "all" ? "全部数据" : "仅本人"}
            </div>
            <div className="role-perms">
              {permLabels.map((p) => (
                <span key={p.key} className={"perm-item " + (r[p.key] ? "on" : "off")}>{p.label}</span>
              ))}
            </div>
            {r.name !== current ? (
              <Btn sm onClick={() => void switchRole(r.name)}>切换到此角色</Btn>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
