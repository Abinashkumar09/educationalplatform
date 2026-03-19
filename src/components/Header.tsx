import { useState } from 'react';
import { BookOpen, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
    setMobileMenuOpen(false);
  };

  const navigate = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('home')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="text-blue-600" size={32} />
              <span className="text-xl font-bold text-gray-900">EduLearn</span>
            </button>

            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => navigate('home')}
                className={`${
                  currentPage === 'home'
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                Home
              </button>
              <button
                onClick={() => navigate('courses')}
                className={`${
                  currentPage === 'courses'
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                Courses
              </button>
              {user && (
                <button
                  onClick={() => navigate('dashboard')}
                  className={`${
                    currentPage === 'dashboard'
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  } transition-colors`}
                >
                  My Learning
                </button>
              )}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User size={20} />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick('signin')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => navigate('home')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => navigate('courses')}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Courses
              </button>
              {user && (
                <button
                  onClick={() => navigate('dashboard')}
                  className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  My Learning
                </button>
              )}
              <div className="border-t border-gray-200 pt-3">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-700">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleAuthClick('signin')}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleAuthClick('signup')}
                      className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </>
  );
}
