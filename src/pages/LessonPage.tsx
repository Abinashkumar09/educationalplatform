import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { supabase, Lesson, Course, LessonProgress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LessonPageProps {
  courseId: string;
  lessonId: string;
  onNavigate: (page: string, courseId?: string, lessonId?: string) => void;
}

export default function LessonPage({ courseId, lessonId, onNavigate }: LessonPageProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadLessonData();
  }, [courseId, lessonId, user]);

  const loadLessonData = async () => {
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      setCourse(courseData);

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      setLesson(lessonData);

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      setAllLessons(lessonsData || []);

      if (user) {
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user || !lesson) return;

    setMarking(true);
    try {
      if (progress) {
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            completed: !progress.completed,
            completed_at: !progress.completed ? new Date().toISOString() : null,
          })
          .eq('id', progress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lesson.id,
            completed: true,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      await loadLessonData();
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setMarking(false);
    }
  };

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Lesson not found</p>
          <button
            onClick={() => onNavigate('course', courseId)}
            className="text-blue-600 hover:underline"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate('course', courseId)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to {course.title}</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Lesson {currentIndex + 1} of {allLessons.length}
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={18} />
              <span className="text-sm">{lesson.duration_minutes} min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="prose max-w-none">
            <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleMarkComplete}
            disabled={marking}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              progress?.completed
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            <CheckCircle2 size={20} />
            <span>
              {marking
                ? 'Updating...'
                : progress?.completed
                ? 'Completed'
                : 'Mark as Complete'}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          {previousLesson ? (
            <button
              onClick={() => onNavigate('lesson', courseId, previousLesson.id)}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Previous Lesson</span>
            </button>
          ) : (
            <div></div>
          )}

          {nextLesson ? (
            <button
              onClick={() => onNavigate('lesson', courseId, nextLesson.id)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next Lesson</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('course', courseId)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
