export interface Task {
  id: string;
  description: string;
  timeSpent: number; // in seconds
  completed: boolean;
  listId: string;
}

export interface TaskList {
  id: string;
  name: string;
}
