/**
 * Client-side route tree.
 *
 * Public marketing/auth routes sit at the top level. Everything under
 * `/dashboard` is wrapped in an outer `ProtectedRoute` (any signed-in role), then
 * nested guards restrict each workspace to its owning role. Unknown URLs fall
 * back to the marketing home page.
 *
 * Route-level code splitting: every page except the landing `Home` is loaded
 * lazily via `React.lazy`, so each route lives in its own chunk and is only
 * fetched when the visitor navigates to it. Each lazy route is wrapped in a
 * `Suspense` boundary with a loading skeleton to prevent layout shifts or
 * flashes while the chunk loads.
 *
 * @returns {JSX.Element} The active route element.
 */
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const ALL_ROLES = ["super_admin", "gym_admin", "coach", "client"];

/** Lazily loaded public routes (Home stays eager as the landing page). */
const Login = lazy(() => import("@/pages/Login"));
const Suspended = lazy(() => import("@/pages/Suspended"));
const Contact = lazy(() => import("@/pages/Contact"));

/** Lazily loaded dashboard shell and its child pages. */
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const RoleHomeRedirect = lazy(() => import("@/routes/RoleHomeRedirect"));
const DashboardHome = lazy(() => import("@/pages/DashboardHome"));
const Account = lazy(() => import("@/pages/Account"));
const GymDashboard = lazy(() => import("@/pages/gym/GymDashboard"));
const GymMembers = lazy(() => import("@/pages/gym/GymMembers"));
const GymCoaches = lazy(() => import("@/pages/gym/GymCoaches"));
const CoachDashboard = lazy(() => import("@/pages/coach/CoachDashboard"));
const AllClients = lazy(() => import("@/pages/coach/AllClients"));
const ExerciseLibrary = lazy(() => import("@/pages/coach/ExerciseLibrary"));
const CoachRoutines = lazy(() => import("@/pages/coach/CoachRoutines"));
const RoutineBuilder = lazy(() => import("@/pages/coach/RoutineBuilder"));
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard"));
const ClientProgress = lazy(() => import("@/pages/client/ClientProgress"));

/**
 * Wraps a lazily loaded route component in a Suspense boundary so a loading
 * skeleton is shown while its chunk is fetched.
 *
 * @param {React.ComponentType} Component - A `React.lazy` component.
 * @returns {JSX.Element} The Suspense-wrapped component.
 */
function LazyRoute({ Component }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes: marketing, sign-in, suspension notice. */}
      <Route path="/login" element={<LazyRoute Component={Login} />} />
      <Route path="/suspended" element={<LazyRoute Component={Suspended} />} />

      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<LazyRoute Component={Contact} />} />

      {/* Authenticated shell shared by every role. */}
      <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
        <Route
          path="/dashboard"
          element={<LazyRoute Component={DashboardLayout} />}
        >
          {/* `/dashboard` resolves to the role's own home page. */}
          <Route
            index
            element={<LazyRoute Component={RoleHomeRedirect} />}
          />

          {/* Platform super admin. */}
          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route
              path="overview"
              element={<LazyRoute Component={DashboardHome} />}
            />
          </Route>

          {/* Gym administrator: members and coaches for one tenant. */}
          <Route element={<ProtectedRoute allowedRoles={["gym_admin"]} />}>
            <Route path="gym" element={<LazyRoute Component={GymDashboard} />} />
            <Route
              path="gym/members"
              element={<LazyRoute Component={GymMembers} />}
            />
            <Route
              path="gym/coaches"
              element={<LazyRoute Component={GymCoaches} />}
            />
          </Route>

          {/* Shared account page. Pending coaches/clients are pinned here by
              ProtectedRoute until they replace their setup PIN. */}
          <Route element={<ProtectedRoute allowedRoles={["coach", "client"]} />}>
            <Route path="account" element={<LazyRoute Component={Account} />} />
          </Route>

          {/* Coach: clients, exercise library, and routine authoring. The same
              builder handles both create and edit via the optional param. */}
          <Route element={<ProtectedRoute allowedRoles={["coach"]} />}>
            <Route path="coach" element={<LazyRoute Component={CoachDashboard} />} />
            <Route
              path="coach/all-clients"
              element={<LazyRoute Component={AllClients} />}
            />
            <Route
              path="coach/exercises"
              element={<LazyRoute Component={ExerciseLibrary} />}
            />
            <Route
              path="coach/routines"
              element={<LazyRoute Component={CoachRoutines} />}
            />
            <Route
              path="coach/routines/new"
              element={<LazyRoute Component={RoutineBuilder} />}
            />
            <Route
              path="coach/routines/:routineId"
              element={<LazyRoute Component={RoutineBuilder} />}
            />
            <Route
              path="coach/programs"
              element={<Navigate to="/dashboard/coach/routines" replace />}
            />
          </Route>

          {/* Client: assigned workouts and progress history. */}
          <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
            <Route path="client" element={<LazyRoute Component={ClientDashboard} />} />
            <Route
              path="client/progress"
              element={<LazyRoute Component={ClientProgress} />}
            />
          </Route>
        </Route>
      </Route>

      {/* Fallback for unknown URLs. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
