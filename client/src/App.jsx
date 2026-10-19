/**
 * Client-side route tree.
 *
 * Public marketing/auth routes sit at the top level. Everything under
 * `/dashboard` is wrapped in an outer `ProtectedRoute` (any signed-in role), then
 * nested guards restrict each workspace to its owning role. Unknown URLs fall
 * back to the marketing home page.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Setup from "@/pages/Setup";
import Suspended from "@/pages/Suspended";
import DashboardHome from "@/pages/DashboardHome";
import RoleHomeRedirect from "@/routes/RoleHomeRedirect";
import GymDashboard from "@/pages/gym/GymDashboard";
import GymMembers from "@/pages/gym/GymMembers";
import GymCoaches from "@/pages/gym/GymCoaches";
import CoachDashboard from "@/pages/coach/CoachDashboard";
import ExerciseLibrary from "@/pages/coach/ExerciseLibrary";
import CoachRoutines from "@/pages/coach/CoachRoutines";
import RoutineBuilder from "@/pages/coach/RoutineBuilder";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientProgress from "@/pages/client/ClientProgress";

const ALL_ROLES = ["super_admin", "gym_admin", "coach", "client"];

/**
 * Root routing component rendered inside `BrowserRouter` and `AuthProvider`.
 * Guards read auth state from context, so this component itself stays stateless.
 *
 * @returns {JSX.Element} The active route element.
 */
export default function App() {
  return (
    <Routes>
      {/* Public routes: marketing, sign-in, one-time setup, suspension notice. */}
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/suspended" element={<Suspended />} />

      <Route path="/" element={<Home />} />

      {/* Authenticated shell shared by every role. */}
      <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* `/dashboard` resolves to the role's own home page. */}
          <Route index element={<RoleHomeRedirect />} />

          {/* Platform super admin. */}
          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route path="overview" element={<DashboardHome />} />
          </Route>

          {/* Gym administrator: members and coaches for one tenant. */}
          <Route element={<ProtectedRoute allowedRoles={["gym_admin"]} />}>
            <Route path="gym" element={<GymDashboard />} />
            <Route path="gym/members" element={<GymMembers />} />
            <Route path="gym/coaches" element={<GymCoaches />} />
          </Route>

          {/* Coach: clients, exercise library, and routine authoring. The same
              builder handles both create and edit via the optional param. */}
          <Route element={<ProtectedRoute allowedRoles={["coach"]} />}>
            <Route path="coach" element={<CoachDashboard />} />
            <Route path="coach/exercises" element={<ExerciseLibrary />} />
            <Route path="coach/routines" element={<CoachRoutines />} />
            <Route path="coach/routines/new" element={<RoutineBuilder />} />
            <Route
              path="coach/routines/:routineId"
              element={<RoutineBuilder />}
            />
            <Route
              path="coach/programs"
              element={<Navigate to="/dashboard/coach/routines" replace />}
            />
          </Route>

          {/* Client: assigned workouts and progress history. */}
          <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
            <Route path="client" element={<ClientDashboard />} />
            <Route path="client/progress" element={<ClientProgress />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback for unknown URLs. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
