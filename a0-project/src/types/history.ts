export interface WorkoutHistory {
  id: string;
  workoutId: string;
  workoutName: string;
  startTime: string;
  endTime: string;
  totalRepetitions: number;
  completed: boolean;
}