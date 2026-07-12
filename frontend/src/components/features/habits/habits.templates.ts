import type { CustomFieldDef } from '@shared/types/customFields';

export interface HabitTemplate {
  id:          string;
  name:        string;
  icon:        string;
  description: string;
  category:    'fitness' | 'learning' | 'wellness' | 'productivity' | 'lifestyle';
  fields:      Omit<CustomFieldDef, 'id'>[];
}

function f(name: string, type: CustomFieldDef['type'], opts?: Partial<Omit<CustomFieldDef, 'id' | 'name' | 'type'>>): Omit<CustomFieldDef, 'id'> {
  return { name, type, showInHistory: true, ...opts };
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'reading',
    name: 'Reading',
    icon: '📚',
    description: 'Track books, pages, and reading time',
    category: 'learning',
    fields: [
      f('Book Title',    'text',    { placeholder: 'What are you reading?' }),
      f('Pages Read',    'number',  { placeholder: 'e.g. 30', includeInAnalytics: true, validation: { min: 1 } }),
      f('Current Page',  'number',  { placeholder: 'e.g. 145' }),
      f('Duration (min)','number',  { placeholder: 'e.g. 45', includeInAnalytics: true, validation: { min: 1 } }),
    ],
  },
  {
    id: 'workout',
    name: 'Workout',
    icon: '🏋️',
    description: 'Log workouts, exercises, and effort',
    category: 'fitness',
    fields: [
      f('Workout Type',    'dropdown',  { options: ['Strength', 'Cardio', 'HIIT', 'CrossFit', 'Yoga', 'Pilates', 'Other'] }),
      f('Duration (min)',  'number',    { placeholder: 'e.g. 60', includeInAnalytics: true, validation: { min: 1 } }),
      f('Exercises',       'long_text', { placeholder: 'Bench press 4×8, Squat 3×10…' }),
      f('Effort (1–10)',   'rating',    { includeInAnalytics: true, validation: { min: 1, max: 10 } }),
    ],
  },
  {
    id: 'running',
    name: 'Running',
    icon: '🏃',
    description: 'Track distance, pace, and duration',
    category: 'fitness',
    fields: [
      f('Distance (km)',   'decimal', { placeholder: 'e.g. 5.2',  includeInAnalytics: true, validation: { min: 0 } }),
      f('Duration (min)',  'number',  { placeholder: 'e.g. 30',   includeInAnalytics: true, validation: { min: 1 } }),
      f('Avg Pace (min/km)', 'decimal', { placeholder: 'e.g. 5.8' }),
      f('Calories',        'number',  { placeholder: 'e.g. 400',  includeInAnalytics: true }),
      f('Route / Notes',   'text',    { placeholder: 'Park loop, trail…' }),
    ],
  },
  {
    id: 'cycling',
    name: 'Cycling',
    icon: '🚴',
    description: 'Track rides, distance, and speed',
    category: 'fitness',
    fields: [
      f('Distance (km)',   'decimal', { placeholder: 'e.g. 25',   includeInAnalytics: true, validation: { min: 0 } }),
      f('Duration (min)',  'number',  { placeholder: 'e.g. 75',   includeInAnalytics: true }),
      f('Avg Speed (km/h)','decimal', { placeholder: 'e.g. 22.5', includeInAnalytics: true }),
      f('Elevation (m)',   'number',  { placeholder: 'e.g. 320',  includeInAnalytics: true }),
      f('Type',            'dropdown',{ options: ['Road', 'Mountain', 'Indoor', 'Commute'] }),
    ],
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: '🧘',
    description: 'Log sessions, technique, and mood',
    category: 'wellness',
    fields: [
      f('Duration (min)',  'number',   { placeholder: 'e.g. 15', includeInAnalytics: true, validation: { min: 1 } }),
      f('Technique',       'dropdown', { options: ['Breath focus', 'Body scan', 'Visualization', 'Loving-kindness', 'Open awareness', 'Mantra', 'Guided'] }),
      f('Mood Before',     'rating',   { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
      f('Mood After',      'rating',   { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
    ],
  },
  {
    id: 'water',
    name: 'Water Intake',
    icon: '💧',
    description: 'Track daily hydration',
    category: 'wellness',
    fields: [
      f('Amount (ml)', 'number',   { placeholder: 'e.g. 500', includeInAnalytics: true, validation: { min: 1 } }),
      f('Vessel',      'dropdown', { options: ['Glass', 'Bottle (500ml)', 'Bottle (1L)', 'Cup', 'Other'] }),
    ],
  },
  {
    id: 'coding',
    name: 'Coding',
    icon: '💻',
    description: 'Track coding sessions and progress',
    category: 'productivity',
    fields: [
      f('Duration (min)', 'number',   { placeholder: 'e.g. 90', includeInAnalytics: true, validation: { min: 1 } }),
      f('Project',        'text',     { placeholder: 'Which project?' }),
      f('Focus Area',     'dropdown', { options: ['Feature', 'Bug fix', 'Refactor', 'Learning', 'Review', 'Planning'] }),
      f('Lines Written',  'number',   { placeholder: 'e.g. 150', includeInAnalytics: true }),
      f('Energy (1–5)',   'rating',   { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
    ],
  },
  {
    id: 'language',
    name: 'Language Learning',
    icon: '🗣️',
    description: 'Track study sessions and progress',
    category: 'learning',
    fields: [
      f('Language',       'text',    { placeholder: 'Spanish, Japanese…' }),
      f('Duration (min)', 'number',  { placeholder: 'e.g. 30', includeInAnalytics: true, validation: { min: 1 } }),
      f('Activity',       'dropdown',{ options: ['Duolingo', 'Flashcards', 'Conversation', 'Listening', 'Reading', 'Writing', 'Grammar'] }),
      f('Words Learned',  'number',  { placeholder: 'e.g. 10', includeInAnalytics: true }),
    ],
  },
  {
    id: 'study',
    name: 'Studying',
    icon: '📖',
    description: 'Log study sessions with focus and topics',
    category: 'learning',
    fields: [
      f('Subject',        'text',    { placeholder: 'e.g. Calculus, History…' }),
      f('Duration (min)', 'number',  { placeholder: 'e.g. 60', includeInAnalytics: true, validation: { min: 1 } }),
      f('Topic',          'text',    { placeholder: 'What did you cover?' }),
      f('Focus (1–5)',    'rating',  { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
    ],
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: '🏅',
    description: 'Track compound lifts and volume',
    category: 'fitness',
    fields: [
      f('Main Lift',      'dropdown', { options: ['Squat', 'Bench', 'Deadlift', 'OHP', 'Row', 'Pull-up', 'Other'] }),
      f('Top Weight (kg)','decimal',  { placeholder: 'e.g. 100', includeInAnalytics: true, validation: { min: 0 } }),
      f('Total Sets',     'number',   { placeholder: 'e.g. 5',   includeInAnalytics: true }),
      f('Total Reps',     'number',   { placeholder: 'e.g. 25',  includeInAnalytics: true }),
      f('Volume (kg)',    'number',   { placeholder: 'e.g. 2500', includeInAnalytics: true }),
    ],
  },
  {
    id: 'journaling',
    name: 'Journaling',
    icon: '✍️',
    description: 'Track writing streaks and mood',
    category: 'productivity',
    fields: [
      f('Words Written', 'number',   { placeholder: 'e.g. 500', includeInAnalytics: true, validation: { min: 1 } }),
      f('Type',          'dropdown', { options: ['Morning pages', 'Gratitude', 'Reflection', 'Goals', 'Free write', 'Dream journal'] }),
      f('Mood',          'rating',   { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
      f('Key Insight',   'text',     { placeholder: 'One thing you want to remember…' }),
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '🌙',
    description: 'Track sleep quality and duration',
    category: 'wellness',
    fields: [
      f('Bedtime',        'time',    {}),
      f('Wake Time',      'time',    {}),
      f('Hours Slept',    'decimal', { placeholder: 'e.g. 7.5', includeInAnalytics: true, validation: { min: 0, max: 24 } }),
      f('Quality (1–5)', 'rating',  { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
      f('Felt Rested',    'checkbox',{ defaultValue: 'false' }),
    ],
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    icon: '🥗',
    description: 'Log meals, calories, and macros',
    category: 'wellness',
    fields: [
      f('Calories',     'number',  { placeholder: 'e.g. 2000', includeInAnalytics: true, validation: { min: 0 } }),
      f('Protein (g)',  'number',  { placeholder: 'e.g. 150',  includeInAnalytics: true }),
      f('Carbs (g)',    'number',  { placeholder: 'e.g. 200',  includeInAnalytics: true }),
      f('Fat (g)',      'number',  { placeholder: 'e.g. 70',   includeInAnalytics: true }),
      f('Rating',       'rating',  { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
    ],
  },
  {
    id: 'practice',
    name: 'Practice',
    icon: '🎸',
    description: 'Track any skill practice — music, art, sport',
    category: 'lifestyle',
    fields: [
      f('Skill',          'text',    { placeholder: 'Guitar, Piano, Chess…' }),
      f('Duration (min)', 'number',  { placeholder: 'e.g. 45', includeInAnalytics: true, validation: { min: 1 } }),
      f('Focus Area',     'text',    { placeholder: 'What specifically did you practice?' }),
      f('Progress (1–5)', 'rating',  { includeInAnalytics: true, validation: { min: 1, max: 5 } }),
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { key: 'all',          label: 'All' },
  { key: 'fitness',      label: '💪 Fitness' },
  { key: 'learning',     label: '📚 Learning' },
  { key: 'wellness',     label: '🌿 Wellness' },
  { key: 'productivity', label: '⚡ Productivity' },
  { key: 'lifestyle',    label: '✨ Lifestyle' },
] as const;
