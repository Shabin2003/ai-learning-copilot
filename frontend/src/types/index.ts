// Core types matching the FastAPI backend schemas

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type SubjectArea = 'math' | 'science' | 'english' | 'history' | 'coding' | 'general'
export type QuestionType = 'mcq' | 'short_answer' | 'true_false' | 'fill_blank'
export type TrendType = 'improving' | 'declining' | 'stable'

// ─── Session ──────────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  student_name: string
  grade_level: number
  subject: SubjectArea
  initial_topic?: string
  difficulty_preference: DifficultyLevel
}

export interface SessionResponse {
  session_id: string
  student_name: string
  subject: string
  difficulty: string
  created_at: string
  learning_path: string[]
  current_topic: string
}

// ─── Questions ────────────────────────────────────────────────────────────────

export interface QuestionOption {
  id: string
  text: string
}

export interface QuestionResponse {
  question_id: string
  session_id: string
  question_text: string
  question_type: QuestionType
  options?: QuestionOption[]
  topic: string
  difficulty: DifficultyLevel
  hint?: string
  estimated_time_seconds: number
}

export interface EvaluationResult {
  is_correct: boolean
  score: number
  feedback: string
  correct_answer: string
  explanation: string
  weak_concepts: string[]
  encouragement: string
}

export interface AnswerResponse {
  evaluation: EvaluationResult
  next_question?: QuestionResponse
  session_updated: boolean
  streak: number
  total_score: number
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TopicPerformance {
  topic: string
  attempts: number
  correct: number
  accuracy: number
  avg_time_seconds: number
  trend: TrendType
}

export interface SessionAnalytics {
  session_id: string
  student_name: string
  total_questions: number
  correct_answers: number
  overall_accuracy: number
  total_time_minutes: number
  current_difficulty: DifficultyLevel
  streak: number
  weak_areas: string[]
  strong_areas: string[]
  topic_performance: TopicPerformance[]
  learning_path: string[]
  completed_topics: string[]
  xp_points: number
  level: number
}

export interface SessionSummary {
  session_id: string
  student_name: string
  questions_answered: number
  accuracy: number
  current_streak: number
  xp_points: number
  level: number
  current_topic: string
  difficulty: string
  weak_areas_count: number
  completed_topics: number
}

// ─── Explainer ────────────────────────────────────────────────────────────────

export interface ExplainConceptResponse {
  concept: string
  explanation: string
  examples: string[]
  analogies: string[]
  practice_suggestion: string
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type LearningPhase =
  | 'idle'
  | 'questioning'
  | 'answering'
  | 'evaluating'
  | 'showing_result'
  | 'explaining'

export interface UIFeedback {
  type: 'correct' | 'incorrect' | 'partial' | 'streak' | 'level_up'
  message: string
  score?: number
}
