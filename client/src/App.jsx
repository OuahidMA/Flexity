import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Components/Layout'
import DashboardHome from './Pages/DashboardHome'
import ExerciseLibrary from './Pages/ExerciseLibrary'
import RoutineBuilder from './Pages/RoutineBuilder'
import WorkoutSessionTracker from './Pages/WorkoutSessionTracker'
import SavedWorkouts from './Pages/SavedWorkouts'
import About from './Pages/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardHome />} />
          <Route path="library" element={<ExerciseLibrary />} />
          <Route path="routines" element={<RoutineBuilder />} />
          <Route path="session" element={<WorkoutSessionTracker />} />
          <Route path="saved" element={<SavedWorkouts />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<DashboardHome />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App