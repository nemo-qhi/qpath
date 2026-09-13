import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "./pages/Home";
import ClassQuizzes from "./pages/ClassQuizzes";
import QuizDetail from "./pages/QuizDetail";
import CreateQuiz from "./pages/CreateQuiz";
import Battle from "./pages/Battle";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCodeInput from "./pages/AdminCodeInput";
import PersonalLearning from "./pages/PersonalLearning";
import TeacherDashboard from "./pages/TeacherDashboard";
import ClassMenu from "./pages/ClassMenu";
import Register from "./pages/Register";
import ClassCodeManager from "./pages/ClassCodeManager";
import RoleSelection from "./pages/RoleSelection";
import TeacherCreateClass from "./pages/TeacherCreateClass";
import StudentJoinClass from "./pages/StudentJoinClass";
import TeacherRoleChoice from "./pages/TeacherRoleChoice";
import TeacherJoinClass from "./pages/TeacherJoinClass";

import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/role-selection"} component={RoleSelection} />
      <Route path={"/teacher/choice"} component={TeacherRoleChoice} />
      <Route path={"/teacher/create-class"} component={TeacherCreateClass} />
      <Route path={"/teacher/join-class"} component={TeacherJoinClass} />
      <Route path={"/student/join-class"} component={StudentJoinClass} />
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/class/:classId/menu"} component={ClassMenu} />
      <Route path={"/class/:classId/code-manager"} component={ClassCodeManager} />
      <Route path={"/class/:classId/quizzes"} component={ClassQuizzes} />

      <Route path={"/class/:classId/create-quiz"} component={CreateQuiz} />
      <Route path={"/class/:classId/quizzes/create"} component={CreateQuiz} />
      <Route path={"/class/:classId/battle"} component={Battle} />
      <Route path={"/class/:classId/teacher"} component={TeacherDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/code"} component={AdminCodeInput} />
      <Route path={"/personal-learning"} component={PersonalLearning} />
      <Route path={"/quiz/:quizId"} component={QuizDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
