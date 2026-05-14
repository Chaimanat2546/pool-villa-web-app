export type UserRole = "admin" | "user";

export function normalizeUserRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : "user";
}

export function getRoleHomePath(role: UserRole) {
  return role === "admin" ? "/admin" : "/user";
}
