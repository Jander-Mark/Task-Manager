import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTasks, createTask, updateTask, deleteTask, markTaskAsCompleted, markTaskAsPending } from '../../services/taskService';
import { getCategories } from '../../services/categoryService';
import { useBackground } from '@/contexts/BackgroundProvider'; // Para o título
import { cn } from '@/lib/utils'; // Para o título

// Esquema de validação com Zod
const taskSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data_vencimento: z.string().optional(),
  categoria_ids: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Interface para o Timestamp do Firestore
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}
interface Task {
  id: string;
  titulo: string;
  descricao: string | null;
  data_vencimento: string | null; // Data como string YYYY-MM-DD ou null
  status: 'pendente' | 'concluída';
  categoria_ids: string[];
  usuario_id: string;
  createdAt: FirestoreTimestamp | string | Date; 
  updatedAt: FirestoreTimestamp | string | Date;
}
interface Category {
  id: string;
  nome: string;
  usuario_id: string;
  createdAt: FirestoreTimestamp | string | Date; 
  updatedAt: FirestoreTimestamp | string | Date; 
}
interface TaskPayload {
    titulo: string;
    descricao?: string;
    data_vencimento?: string;
    categoria_ids?: string[];
}

// *** FUNÇÃO DE FORMATAR DATA ATUALIZADA ***
// Lida com YYYY-MM-DD, Timestamps do Firestore e objetos Date.
const formatDate = (timestamp: FirestoreTimestamp | string | Date | null): string => {
  if (!timestamp) return 'Sem data'; // Mensagem genérica

  let date: Date;

  if (typeof timestamp === 'string') {
    // Se for string YYYY-MM-DD (data_vencimento)
    if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
        // Adiciona T00:00:00 para tratar como fuso local e evitar bug de "dia anterior"
        date = new Date(`${timestamp}T00:00:00`);
    } else {
        // Se for outra string de data (do updatedAt, por exemplo)
        date = new Date(timestamp);
    }
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && typeof timestamp._seconds === 'number') {
    // Converte Timestamp do Firestore para Date
    date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  } else {
    console.warn('Formato de data desconhecido:', timestamp);
    return 'Data inválida'; // Formato desconhecido
  }

  // Verifica se a data resultante é válida
  if (isNaN(date.getTime())) {
    console.warn('Tentativa de formatar data inválida:', timestamp);
    return 'Data inválida';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Função helper de timestamp (mantida)
const getTimestampMillis = (timestamp: FirestoreTimestamp | string | Date | null): number => {
    if (!timestamp) return 0;
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && typeof (timestamp as any)._seconds === 'number') {
      const ts = timestamp as FirestoreTimestamp;
      date = new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000);
    } else {
      return 0;
    }
    return isNaN(date.getTime()) ? 0 : date.getTime();
}

// Função helper para verificar se a tarefa PENDENTE está atrasada (mantida)
const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'concluída' || !task.data_vencimento) {
    return false;
  }
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(`${task.data_vencimento}T00:00:00`);
    return dataVencimento < hoje;
  } catch (e) {
    return false;
  }
};

// Função helper para verificar se foi concluída com atraso (mantida)
const wasCompletedLate = (task: Task): boolean => {
  if (task.status === 'pendente' || !task.data_vencimento || !task.updatedAt) {
    return false;
  }
  
  try {
    // Normaliza a data de conclusão para o início do dia
    const completionDate = new Date(getTimestampMillis(task.updatedAt));
    completionDate.setHours(0, 0, 0, 0); 

    // Normaliza a data de vencimento
    const dueDate = new Date(`${task.data_vencimento}T00:00:00`);
    
    // Foi concluída *depois* do dia do vencimento
    return completionDate > dueDate;
  } catch (e) {
    return false;
  }
};

// Componente TaskItem (mantido)
const TaskItem: React.FC<{ 
  task: Task;
  categories: Category[];
  getCategoryName: (id: string) => string;
  toggleTaskStatus: (task: Task) => void;
  openEditModal: (task: Task) => void;
  handleDeleteTask: (id: string) => void;
}> = ({ task, getCategoryName, toggleTaskStatus, openEditModal, handleDeleteTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = React.useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const checkClamp = () => {
      if (descriptionRef.current) {
        setIsClamped(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
      }
    };
    checkClamp();
    window.addEventListener('resize', checkClamp);
    return () => window.removeEventListener('resize', checkClamp);
  }, [task.descricao]); 

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsExpanded(!isExpanded);
  };
  
  // Variáveis de estado para legibilidade
  const isPendente = task.status === 'pendente';
  const isConcluida = task.status === 'concluída';
  const isAtrasada = isTaskOverdue(task);       // Pendente e atrasada
  const foiConcluidaComAtraso = wasCompletedLate(task); // Concluída e atrasada

  return (
    <li key={task.id}>
      <div className="block hover:bg-gray-50 dark:hover:bg-zinc-800/50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1 mr-4 max-w-[60%]">
              <input
                type="checkbox"
                checked={isConcluida}
                onChange={() => toggleTaskStatus(task)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <p
                className={`ml-3 text-sm font-medium truncate overflow-hidden break-all ${
                  isConcluida ? 'text-gray-400 line-through' : 'text-blue-600 dark:text-blue-400'
                }`}
                title={task.titulo}
                style={{ maxWidth: 'calc(100% - 1.5rem)' }} 
              >
                {task.titulo}
              </p>
            </div>
            <div className="ml-2 flex flex-shrink-0">
              {task.categoria_ids && task.categoria_ids.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {task.categoria_ids.map((categoryId) => (
                    <span
                      key={categoryId}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {getCategoryName(categoryId)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-2">
            <div className="w-full overflow-hidden">
              <p
                ref={descriptionRef}
                className={`text-sm text-gray-500 dark:text-gray-400 break-all overflow-hidden ${
                  !isExpanded ? 'line-clamp-2' : ''
                }`}
                style={{ wordBreak: 'break-all', maxWidth: '100%' }}
              >
                {task.descricao || 'Sem descrição'}
              </p>
              {(task.descricao && (isClamped || isExpanded)) && (
                <button
                  onClick={toggleExpand}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium mt-1"
                >
                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>

            <div className="flex items-center text-sm flex-shrink-0 justify-end">
              
              {/* *** BLOCO DE LÓGICA DE DATA ATUALIZADO *** */}
              <div className="mr-4 flex-shrink-0 text-right">
                
                {/* Linha 1: Data de Vencimento (Sempre visível se existir) */}
                {task.data_vencimento && (
                  <p className={cn(
                    "text-sm whitespace-nowrap",
                    (isAtrasada && isPendente) || foiConcluidaComAtraso
                      ? "text-red-600 font-semibold" // Vermelho se atrasado (pendente ou concluído)
                      : "text-gray-500 dark:text-gray-400" // Cor normal
                  )}>
                    Vencimento: {formatDate(task.data_vencimento)}
                  </p>
                )}

                {/* Linha 2: Status (Concluído ou Atrasado) */}
                {isConcluida ? (
                  <p className={cn(
                    "text-xs font-semibold whitespace-nowrap",
                    foiConcluidaComAtraso ? "text-red-600" : "text-green-600"
                  )}>
                    Concluído em: {formatDate(task.updatedAt)}
                  </p>
                ) : (
                  isAtrasada && (
                    <p className="text-xs font-semibold text-red-600 whitespace-nowrap">
                      (Tarefa em atraso)
                    </p>
                  )
                )}
              </div>
              
              {/* Botões (mantidos) */}
              <div className="flex flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                  className="mr-2 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 dark:ring-zinc-600 dark:hover:bg-zinc-600"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                  className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-600/10 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20 dark:hover:bg-red-900/30"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};


const TaskList: React.FC = () => {
  const { background } = useBackground(); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'concluída'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  // Carregar tarefas e categorias
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksData, categoriesData] = await Promise.all([
          getTasks(),
          getCategories(),
        ]);
        const sortedTasks = tasksData.sort((a, b) => {
          if (a.status === 'pendente' && b.status === 'concluída') return -1;
          if (a.status === 'concluída' && b.status === 'pendente') return 1;
          return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
        });
        setTasks(sortedTasks);
        setCategories(categoriesData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Lógica de CRUD (toda mantida)
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'todos' && task.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'todos' && !task.categoria_ids.includes(categoryFilter)) {
      return false;
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingTask(null);
    reset({
      titulo: '',
      descricao: '',
      data_vencimento: '',
      categoria_ids: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setValue('titulo', task.titulo);
    setValue('descricao', task.descricao || '');
    setValue('data_vencimento', task.data_vencimento || '');
    setValue('categoria_ids', task.categoria_ids || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    reset();
  };

  const onSubmit = async (data: TaskFormData) => {
    const payload: TaskPayload = {
      titulo: data.titulo,
      descricao: data.descricao ? data.descricao : undefined,
      data_vencimento: data.data_vencimento ? data.data_vencimento : undefined,
      categoria_ids: data.categoria_ids && data.categoria_ids.length > 0 ? data.categoria_ids : undefined,
    };
    Object.keys(payload).forEach(key => payload[key as keyof TaskPayload] === undefined && delete payload[key as keyof TaskPayload]);

    try {
      let updatedOrNewTask: Task;
      if (editingTask) {
        updatedOrNewTask = await updateTask(editingTask.id, payload);
        setTasks(tasks.map(task => (task.id === updatedOrNewTask.id ? updatedOrNewTask : task)));
      } else {
        updatedOrNewTask = await createTask(payload);
        setTasks(prevTasks => 
          [updatedOrNewTask, ...prevTasks].sort((a, b) => {
            if (a.status === 'pendente' && b.status === 'concluída') return -1;
            if (a.status === 'concluída' && b.status === 'pendente') return 1;
            return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
          })
        );
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar tarefa');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao excluir tarefa');
      }
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      let updatedTask;
      if (task.status === 'pendente') {
        updatedTask = await markTaskAsCompleted(task.id);
      } else {
        updatedTask = await markTaskAsPending(task.id);
      }
      setTasks(prevTasks => 
        prevTasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
                 .sort((a, b) => {
                    if (a.status === 'pendente' && b.status === 'concluída') return -1;
                    if (a.status === 'concluída' && b.status === 'pendente') return 1;
                    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
                  })
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status da tarefa');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.nome : '';
  };

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                "text-3xl font-bold leading-tight",
                background === 'default' 
                  ? "text-gray-900 dark:text-gray-100" 
                  : "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]"
              )}>
                Tarefas
              </h1>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={openCreateModal}
                className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Nova Tarefa
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {error && (
              <div className="mb-4 rounded-md bg-red-100 p-4 border border-red-400">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Filtros */} 
            <div className="mb-6 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
                <select 
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'pendente' | 'concluída')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="concluída">Concluídas</option>
                </select>
              </div>
              <div>
                <label htmlFor="categoryFilter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Categoria:</label>
                <select 
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                >
                  <option value="todos">Todas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Tarefas (Card Sólido) */}
            <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-zinc-900">
              <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Carregando tarefas...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="rounded-md bg-yellow-50 p-4 m-4 dark:bg-yellow-900/20 dark:border dark:border-yellow-400/30">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Nenhuma tarefa encontrada</h3>
                          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                              <p>Nenhuma tarefa corresponde aos filtros selecionados.</p>
                          </div>
                        </div>
                      </div>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      categories={categories}
                      getCategoryName={getCategoryName}
                      toggleTaskStatus={toggleTaskStatus}
                      openEditModal={openEditModal}
                      handleDeleteTask={handleDeleteTask}
                    />
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modal (mantido) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-zinc-900 px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  {/* Título */}
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Título *
                    </label>
                    <input
                      type="text"
                      id="titulo"
                      {...register('titulo')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                    {errors.titulo && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titulo.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descrição
                    </label>
                    <textarea
                      id="descricao"
                      rows={3}
                      {...register('descricao')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                  </div>

                  {/* Data de Vencimento */}
                  <div>
                    <label htmlFor="data_vencimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      id="data_vencimento"
                      {...register('data_vencimento')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                  </div>

                  {/* Categorias */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categorias</label>
                    <div className="mt-2 space-y-2">
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma categoria disponível.</p>
                      ) : (
                        categories.map((category) => (
                          <div key={category.id} className="flex items-center">
                            <input
                              id={`category-${category.id}`}
                              type="checkbox"
                              value={category.id}
                              {...register('categoria_ids')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`category-${category.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                              {category.nome}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    >
                      {editingTask ? 'Salvar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm dark:bg-zinc-700 dark:text-gray-200 dark:border-zinc-600 dark:hover:bg-zinc-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;