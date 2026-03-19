import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CoursePage from './pages/CoursePage';
import LessonPage from './pages/LessonPage';
import DashboardPage from './pages/DashboardPage';

type Page = 'home' | 'courses' | 'course' | 'lesson' | 'dashboard';

interface PageState {
  page: Page;
  courseId?: string;
  lessonId?: string;
}

function App() {
  const [pageState, setPageState] = useState<PageState>({ page: 'home' });

  const handleNavigate = (page: string, courseId?: string, lessonId?: string) => {
    setPageState({ page: page as Page, courseId, lessonId });
  };

  const renderPage = () => {
    switch (pageState.page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'courses':
        return <CoursesPage onNavigate={handleNavigate} />;
      case 'course':
        return pageState.courseId ? (
          <CoursePage courseId={pageState.courseId} onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case 'lesson':
        return pageState.courseId && pageState.lessonId ? (
          <LessonPage
            courseId={pageState.courseId}
            lessonId={pageState.lessonId}
            onNavigate={handleNavigate}
          />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {pageState.page !== 'lesson' && (
          <Header currentPage={pageState.page} onNavigate={handleNavigate} />
        )}
        {renderPage()}
      </div>
    </AuthProvider>
  );
}

export default App;
