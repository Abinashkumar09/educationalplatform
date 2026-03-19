import { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Award, Clock } from 'lucide-react';
import { supabase, Course, Enrollment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CourseCard from '../components/CourseCard';

interface DashboardPageProps {
  onNavigate: (page: string, courseId?: string) => void;
}

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentError) throw enrollmentError;

      const enrollmentsWithProgress = await Promise.all(
        (enrollmentData || []).map(async (enrollment) => {
          const { data: courseData } = await supabase
            .from('courses')
            .select('*')
            .eq('id', enrollment.course_id)
            .maybeSingle();

          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', enrollment.course_id);

          const totalLessons = lessonsData?.length || 0;

          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessonsData?.map(l => l.id) || []);

          const completedLessons = progressData?.length || 0;
          const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

          return {
            ...enrollment,
            course: courseData!,
            progress,
            completedLessons,
            totalLessons,
          };
        })
      );

      setEnrollments(enrollmentsWithProgress);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please sign in to view your dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter(e => e.progress === 100).length;
  const averageProgress = totalEnrollments > 0
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
    : 0;
  const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + e.completedLessons, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">My Learning Dashboard</h1>
          <p className="text-xl text-blue-100">Track your progress and continue your journey</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="text-blue-600" size={32} />
            </div>
            <p className="text-gray-600 text-sm mb-1">Enrolled Courses</p>
            <p className="text-3xl font-bold text-gray-900">{totalEnrollments}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-green-600" size={32} />
            </div>
            <p className="text-gray-600 text-sm mb-1">Completed Courses</p>
            <p className="text-3xl font-bold text-gray-900">{completedCourses}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-yellow-600" size={32} />
            </div>
            <p className="text-gray-600 text-sm mb-1">Average Progress</p>
            <p className="text-3xl font-bold text-gray-900">{Math.round(averageProgress)}%</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-red-600" size={32} />
            </div>
            <p className="text-gray-600 text-sm mb-1">Lessons Completed</p>
            <p className="text-3xl font-bold text-gray-900">{totalLessonsCompleted}</p>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No courses enrolled yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your learning journey by enrolling in a course
            </p>
            <button
              onClick={() => onNavigate('courses')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Courses</h2>
            <div className="space-y-6">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <img
                        src={enrollment.course.image_url}
                        alt={enrollment.course.title}
                        className="w-full md:w-48 h-48 object-cover rounded-lg"
                      />

                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {enrollment.course.description}
                        </p>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-gray-700">Progress</span>
                            <span className="text-gray-600">
                              {enrollment.completedLessons} / {enrollment.totalLessons} lessons
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${enrollment.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {Math.round(enrollment.progress)}% Complete
                          </p>
                        </div>

                        <button
                          onClick={() => onNavigate('course', enrollment.course_id)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {enrollment.progress > 0 ? 'Continue Learning' : 'Start Course'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
