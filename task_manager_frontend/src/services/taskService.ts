import api from './api';

export interface Task {
  imageUrl(imageUrl: any): unknown;
  id: string;
  titulo: string;
  descricao: string | null;
  data_vencimento: string | null;
  status: 'pendente' | 'concluída';
  categoria_ids: string[];
  usuario_id: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskData {
  titulo: string;
  descricao?: string;
  data_vencimento?: string;
  status?: 'pendente' | 'concluída';
  categoria_ids?: string[];
}

interface UpdateTaskData {
  titulo?: string;
  descricao?: string;
  data_vencimento?: string;
  status?: 'pendente' | 'concluída';
  categoria_ids?: string[];
}

// Buscar todas as tarefas do usuário
export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data;
};

// Buscar uma tarefa específica por ID
export const getTaskById = async (taskId: string): Promise<Task> => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// Criar uma nova tarefa
export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

// Atualizar uma tarefa existente
export const updateTask = async (taskId: string, taskData: UpdateTaskData): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

// Excluir uma tarefa
export const deleteTask = async (taskId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};

// Marcar tarefa como concluída (helper function)
export const markTaskAsCompleted = async (taskId: string): Promise<Task> => {
  return updateTask(taskId, { status: 'concluída' });
};

// Marcar tarefa como pendente (helper function)
export const markTaskAsPending = async (taskId: string): Promise<Task> => {
  return updateTask(taskId, { status: 'pendente' });
};
