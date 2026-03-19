import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Award, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { supabase, Course, Lesson, Enrollment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CoursePageProps {
  courseId: string;
  onNavigate: (page: string, courseId?: string, lessonId?: string) => void;
}

export default function CoursePage({ courseId, onNavigate }: CoursePageProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId, user]);

  const loadCourseData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      if (user) {
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .maybeSingle();

        setEnrollment(enrollmentData);

        if (enrollmentData) {
          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessonsData?.map(l => l.id) || []);

          if (progressData) {
            setCompletedLessons(new Set(progressData.map(p => p.lesson_id)));
          }
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      alert('Please sign in to enroll in this course');
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
        });

      if (error) throw error;
      await loadCourseData();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Course not found</p>
          <button
            onClick={() => onNavigate('courses')}
            className="text-blue-600 hover:underline"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('courses')}
            className="flex items-center space-x-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Courses</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Award size={20} />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen size={20} />
                  <span>{totalLessons} Lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={20} />
                  <span>{lessons.reduce((sum, l) => sum + l.duration_minutes, 0)} minutes</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 text-gray-900">
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />

                {enrollment ? (
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">Your Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {completedCount} of {totalLessons} lessons completed
                      </p>
                    </div>
                    <button
                      onClick={() => lessons.length > 0 && onNavigate('lesson', courseId, lessons[0].id)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {completedCount > 0 ? 'Continue Learning' : 'Start Course'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || !user}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {enrolling ? 'Enrolling...' : user ? 'Enroll Now' : 'Sign in to Enroll'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Course Content</h2>

        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              onClick={() => enrollment && onNavigate('lesson', courseId, lesson.id)}
              className={`bg-white rounded-lg shadow-md p-6 ${
                enrollment ? 'cursor-pointer hover:shadow-lg' : 'opacity-75'
              } transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {completedLessons.has(lesson.id) ? (
                      <CheckCircle2 className="text-green-500" size={24} />
                    ) : (
                      <Circle className="text-gray-400" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-semibold text-gray-500">
                        Lesson {index + 1}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{lesson.duration_minutes} min</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {lesson.content.substring(0, 150)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
