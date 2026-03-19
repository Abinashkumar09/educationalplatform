/*
  # Educational Platform Database Schema

  1. New Tables
    - `courses`
      - `id` (uuid, primary key) - Unique course identifier
      - `title` (text) - Course title
      - `description` (text) - Course description
      - `instructor` (text) - Instructor name
      - `image_url` (text) - Course thumbnail image
      - `difficulty_level` (text) - Beginner, Intermediate, or Advanced
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `lessons`
      - `id` (uuid, primary key) - Unique lesson identifier
      - `course_id` (uuid, foreign key) - Reference to courses table
      - `title` (text) - Lesson title
      - `content` (text) - Lesson content/body
      - `order_index` (integer) - Order of lesson in course
      - `duration_minutes` (integer) - Estimated duration
      - `created_at` (timestamptz) - Creation timestamp
    
    - `enrollments`
      - `id` (uuid, primary key) - Unique enrollment identifier
      - `user_id` (uuid) - Reference to auth.users
      - `course_id` (uuid, foreign key) - Reference to courses table
      - `enrolled_at` (timestamptz) - Enrollment timestamp
      - `completed_at` (timestamptz, nullable) - Completion timestamp
    
    - `lesson_progress`
      - `id` (uuid, primary key) - Unique progress identifier
      - `user_id` (uuid) - Reference to auth.users
      - `lesson_id` (uuid, foreign key) - Reference to lessons table
      - `completed` (boolean) - Whether lesson is completed
      - `completed_at` (timestamptz, nullable) - Completion timestamp
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Courses and lessons are publicly readable
    - Only authenticated users can enroll in courses
    - Users can only view and manage their own enrollments and progress
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructor text NOT NULL,
  image_url text DEFAULT '',
  difficulty_level text DEFAULT 'Beginner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  duration_minutes integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are publicly readable"
  ON courses FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Lessons are publicly readable"
  ON lessons FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);