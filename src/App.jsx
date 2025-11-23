
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";

import BookList from "@/pages/admin/books/BookList";
import BookForm from "@/pages/admin/books/BookForm";
import BookStructure from "@/pages/admin/books/BookStructure";
import ContentEditor from "@/pages/admin/content/ContentEditor";

import ClassList from "@/pages/admin/classes/ClassList";
import ClassForm from "@/pages/admin/classes/ClassForm";

import StudentList from "@/pages/admin/students/StudentList";
import StudentForm from "@/pages/admin/students/StudentForm";

import FinancialDashboard from "@/pages/admin/financial/FinancialDashboard";
import PaymentList from "@/pages/admin/financial/PaymentList";
import PaymentForm from "@/pages/admin/financial/PaymentForm";

import StudentLayout from "@/layouts/StudentLayout";
import BookPlayer from "@/pages/student/BookPlayer";
import BookCover from "@/pages/student/BookCover";
import StudentDashboard from "@/pages/student/StudentDashboard";

import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import LessonList from "@/pages/teacher/lessons/LessonList";
import LessonSelector from "@/pages/teacher/lessons/LessonSelector";
import LessonForm from "@/pages/teacher/lessons/LessonForm";
import LessonDetails from "@/pages/teacher/lessons/LessonDetails";

import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RootRedirect from "@/components/auth/RootRedirect";

import Dashboard from "@/pages/admin/Dashboard";

import LandingPage from "@/pages/LandingPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            {/* Books Routes */}
            <Route path="books" element={<BookList />} />
            <Route path="books/new" element={<BookForm />} />
            <Route path="books/edit/:id" element={<BookForm />} />
            <Route path="books/structure/:id" element={<BookStructure />} />
            <Route path="books/:bookId/units/:unitId/lessons/:lessonId" element={<ContentEditor />} />

            {/* Classes Routes */}
            <Route path="classes" element={<ClassList />} />
            <Route path="classes/new" element={<ClassForm />} />
            <Route path="classes/edit/:id" element={<ClassForm />} />

            {/* Students Routes */}
            <Route path="students" element={<StudentList />} />
            <Route path="students/new" element={<StudentForm />} />
            <Route path="students/edit/:id" element={<StudentForm />} />

            {/* Financial Routes */}
            <Route path="financial" element={<FinancialDashboard />} />
            <Route path="financial/payments" element={<PaymentList />} />
            <Route path="financial/payments/new" element={<PaymentForm />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="book/:bookId" element={<BookCover />} />
            <Route path="book/:bookId/player" element={<BookPlayer />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboard />} />
            <Route path="lessons" element={<LessonList />} />
            <Route path="lessons/select" element={<LessonSelector />} />
            <Route path="lessons/new" element={<LessonForm />} />
            <Route path="lessons/:id" element={<LessonDetails />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
