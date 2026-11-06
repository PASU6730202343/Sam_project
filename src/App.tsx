import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './features/auth/authStore';
import { RequireAuth } from './features/auth/RequireAuth';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LanguagePage from './pages/LanguagePage';
import CareersPage from './pages/CareersPage';
import LessonDetailPage from './pages/LessonDetailPage';
import VocabularyPage from './pages/VocabularyPage';
import GrammarPage from './pages/GrammarPage';
import ConversationPage from './pages/ConversationPage';
import PracticePage from './pages/PracticePage';
import StarredPage from './pages/StarredPage';
import ProfilePage from './pages/ProfilePage';
import ScoresPage from './pages/ScoresPage';

export default function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="language" element={<LanguagePage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="careers/:careerId" element={<CareersPage />} />
            <Route path="lesson/:lessonId" element={<LessonDetailPage />} />
            <Route path="lesson/:lessonId/vocab" element={<VocabularyPage />} />
            <Route path="lesson/:lessonId/grammar" element={<GrammarPage />} />
            <Route path="lesson/:lessonId/practice" element={<PracticePage />} />
            <Route path="lesson/:lessonId/conversation" element={<ConversationPage />} />
            <Route path="scores" element={<ScoresPage />} />
            <Route path="starred" element={<StarredPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
