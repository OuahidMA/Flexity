/**
 * Index route for `/dashboard`.
 *
 * Super admins get the platform overview in place; every other role is sent to
 * its dedicated landing route via `ROLE_HOME`. Keeping the check here avoids
 * duplicating role logic in the router config.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleHome } from "@/lib/roles";
import DashboardHome from "@/pages/DashboardHome";

/**
 * @returns {JSX.Element} The super-admin overview or a role-based redirect.
 */
export default function RoleHomeRedirect() {
  const { role } = useAuth();

  if (role === "super_admin") {
    return <DashboardHome />;
  }

  return <Navigate to={getRoleHome(role)} replace />;
}
