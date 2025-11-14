import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask, markTaskAsCompleted, markTaskAsPending } from '../../services/taskService';
import { getCategories } from '../../services/categoryService';

// Esquema de validação com Zod
const taskSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data_vencimento: z.string().optional(), // Mantém como string opcional do formulário
  categoria_ids: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Interface para o Timestamp do Firestore (se aplicável, vindo do backend)
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
  createdAt: FirestoreTimestamp | string | Date; // Ajustado para aceitar diferentes tipos
  updatedAt: FirestoreTimestamp | string | Date;
}

interface Category {
  id: string;
  nome: string;
  usuario_id: string;
}

// Definir o tipo para os dados de criação/atualização aqui
// Garante que os campos opcionais sejam string ou undefined
interface TaskPayload {
    titulo: string;
    descricao?: string;
    data_vencimento?: string;
    categoria_ids?: string[];
}

// Função helper para formatar a data YYYY-MM-DD para DD/MM/YYYY
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Sem data de vencimento';
  try {
    // Verifica se a string tem o formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    // Tenta formatar como data genérica se não for YYYY-MM-DD (fallback)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        // Adiciona um dia para compensar problemas de fuso horário na conversão
        date.setDate(date.getDate() + 1);
        return date.toLocaleDateString('pt-BR');
    }
    return dateString; // Retorna a string original se não for reconhecida
  } catch (e) {
    console.error("Erro ao formatar data:", dateString, e);
    return dateString; // Retorna a string original em caso de erro
  }
};

// Função helper para verificar se a tarefa está atrasada
const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'concluída' || !task.data_vencimento) {
    return false;
  }
  try {
    // Obtém a data atual no início do dia (00:00:00) no fuso horário local
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Converte a data de vencimento (YYYY-MM-DD) para um objeto Date
    // Adiciona T00:00:00 para evitar problemas de fuso horário
    const dataVencimento = new Date(`${task.data_vencimento}T00:00:00`);

    // Compara se a data de vencimento é anterior à data atual
    return dataVencimento < hoje;
  } catch (e) {
    console.error("Erro ao verificar se tarefa está atrasada:", task.data_vencimento, e);
    return false; // Retorna false em caso de erro na conversão
  }
};

// Componente TaskItem para gerenciar estado de expansão individualmente
const TaskItem: React.FC<{ 
  task: Task;
  categories: Category[];
  getCategoryName: (id: string) => string;
  toggleTaskStatus: (task: Task) => void;
  openEditModal: (task: Task) => void;
  handleDeleteTask: (id: string) => void;
}> = ({ task, getCategoryName, toggleTaskStatus, openEditModal, handleDeleteTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOverdue = isTaskOverdue(task);
  const descriptionRef = React.useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  // Verifica se o texto da descrição está realmente sendo limitado (clamp)
  useEffect(() => {
    const checkClamp = () => {
      if (descriptionRef.current) {
        // Compara a altura de rolagem com a altura visível
        setIsClamped(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
      }
    };
    // Verifica inicialmente e em redimensionamentos
    checkClamp();
    window.addEventListener('resize', checkClamp);
    return () => window.removeEventListener('resize', checkClamp);
  }, [task.descricao]); // Re-verifica se a descrição mudar

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão propague para o item da lista
    setIsExpanded(!isExpanded);
  };

  return (
    <li key={task.id}>
      <div className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          {/* Linha Superior: Checkbox, Título, Categorias */}
          <div className="flex items-center justify-between">
            {/* Checkbox e Título */}
            <div className="flex items-center min-w-0 flex-1 mr-4 max-w-[60%]"> {/* Adicionado max-w-[60%] para limitar largura */}
              <input
                type="checkbox"
                checked={task.status === 'concluída'}
                onChange={() => toggleTaskStatus(task)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <p
                className={`ml-3 text-sm font-medium truncate overflow-hidden break-all ${
                  task.status === 'concluída' ? 'text-gray-400 line-through' : 'text-blue-600'
                }`}
                title={task.titulo}
                style={{ maxWidth: 'calc(100% - 1.5rem)' }} /* Garante espaço para o checkbox */
              >
                {task.titulo}
              </p>
            </div>
            {/* Categorias */}
            <div className="ml-2 flex flex-shrink-0">
              {task.categoria_ids && task.categoria_ids.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {task.categoria_ids.map((categoryId) => (
                    <span
                      key={categoryId}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {getCategoryName(categoryId)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Linha Inferior: Descrição, Data, Botões */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-2"> {/* Substituído flex por grid para melhor controle */}
            {/* Descrição (com expansão) */}
            <div className="w-full overflow-hidden"> {/* Garante que o container não ultrapasse sua largura */}
              <p
                ref={descriptionRef}
                className={`text-sm text-gray-500 break-all overflow-hidden ${
                  !isExpanded ? 'line-clamp-2' : ''
                }`}
                style={{ wordBreak: 'break-all', maxWidth: '100%' }} /* Força quebra de qualquer caractere */
              >
                {task.descricao || 'Sem descrição'}
              </p>
              {/* Botão Ver mais/menos - aparece apenas se o texto for grande o suficiente */}
              {(task.descricao && (isClamped || isExpanded)) && (
                <button
                  onClick={toggleExpand}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                >
                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>

            {/* Data e Botões (Não encolher) */}
            <div className="flex items-center text-sm flex-shrink-0 justify-end"> {/* Adicionado justify-end */}
              {/* Data e Status Atraso */}
              <div className="flex items-center mr-4 flex-shrink-0"> {/* Adicionado flex-shrink-0 */}
                  <p className={`${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'} whitespace-nowrap`}> {/* Adicionado whitespace-nowrap */}
                    {formatDate(task.data_vencimento)}
                  </p>
                  {isOverdue && (
                    <span className="ml-2 text-xs font-semibold text-red-600 whitespace-nowrap">(Tarefa em atraso)</span>
                  )}
              </div>
              {/* Botões */}
              <div className="flex flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                  className="mr-2 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                  className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-600/10 hover:bg-red-100"
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
        // Ordenar tarefas: pendentes primeiro, depois concluídas. Dentro de cada grupo, por data de criação (mais recentes primeiro)
        const sortedTasks = tasksData.sort((a, b) => {
          if (a.status === 'pendente' && b.status === 'concluída') return -1;
          if (a.status === 'concluída' && b.status === 'pendente') return 1;
          // Se status for igual, ordenar por data de criação (assumindo que createdAt existe e é comparável)
          const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as FirestoreTimestamp)?._seconds * 1000 || 0).getTime();
          const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as FirestoreTimestamp)?._seconds * 1000 || 0).getTime();
          return dateB - dateA; // Mais recentes primeiro
        });
        setTasks(sortedTasks);
        setCategories(categoriesData);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar dados');
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'todos' && task.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'todos' && !task.categoria_ids.includes(categoryFilter)) {
      return false;
    }
    return true;
  });

  // Abrir modal para criar nova tarefa
  const openCreateModal = () => {
    setEditingTask(null);
    reset({
      titulo: '',
      descricao: '',
      data_vencimento: '', // Input date espera string vazia
      categoria_ids: [],
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar tarefa existente
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setValue('titulo', task.titulo);
    setValue('descricao', task.descricao || '');
    // Garante que a data no formulário esteja no formato YYYY-MM-DD ou vazia
    setValue('data_vencimento', task.data_vencimento || '');
    setValue('categoria_ids', task.categoria_ids || []);
    setIsModalOpen(true);
  };

  // Fechar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    reset();
  };

  // Enviar formulário (criar ou editar tarefa)
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
        // Adiciona nova tarefa e reordena
        setTasks(prevTasks => 
          [updatedOrNewTask, ...prevTasks].sort((a, b) => {
            if (a.status === 'pendente' && b.status === 'concluída') return -1;
            if (a.status === 'concluída' && b.status === 'pendente') return 1;
            const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as FirestoreTimestamp)?._seconds * 1000 || 0).getTime();
            const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as FirestoreTimestamp)?._seconds * 1000 || 0).getTime();
            return dateB - dateA;
          })
        );
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar tarefa');
      console.error('Erro ao salvar tarefa:', err);
    }
  };

  // Excluir tarefa
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao excluir tarefa');
        console.error('Erro ao excluir tarefa:', err);
      }
    }
  };

  // Alternar status da tarefa (pendente/concluída)
  const toggleTaskStatus = async (task: Task) => {
    try {
      let updatedTask;
      if (task.status === 'pendente') {
        updatedTask = await markTaskAsCompleted(task.id);
      } else {
        updatedTask = await markTaskAsPending(task.id);
      }
       // Atualiza a tarefa e reordena a lista
      setTasks(prevTasks => 
        prevTasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
                 .sort((a, b) => {
                    if (a.status === 'pendente' && b.status === 'concluída') return -1;
                    if (a.status === 'concluída' && b.status === 'pendente') return 1;
                    const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as FirestoreTimestamp)?._seconds * 1000 || 0).getTime();
                    const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as FirestoreTimestamp)?._seconds * 1000 || 0).getTime();
                    return dateB - dateA;
                  })
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status da tarefa');
      console.error('Erro ao atualizar status da tarefa:', err);
    }
  };

  // Obter nome da categoria pelo ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.nome : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        {/* ... (código da navegação existente) ... */}
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">Gerenciador de Tarefas</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  to="/tasks"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Tarefas
                </Link>
                <Link
                  to="/categories"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Categorias
                </Link>
              </div>
            </div>
             {/* ... (restante da navegação) ... */}
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          {/* ... (código do header existente) ... */}
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold leading-tight text-gray-900">Tarefas</h1>
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
                <div className="mb-4 rounded-md bg-red-50 p-4">
                   {/* ... (exibição do erro existente) ... */}
                   <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.707-4.293a1 1 0 001.414 1.414L10 11.414l.293.293a1 1 0 001.414-1.414L11.414 10l.293-.293a1 1 0 00-1.414-1.414L10 8.586l-.293-.293a1 1 0 00-1.414 1.414L8.586 10l-.293.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erro</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                </div>
              )}

              {/* Filtros */} 
              <div className="mb-6 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700">Status:</label>
                  <select 
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'pendente' | 'concluída')}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendentes</option>
                    <option value="concluída">Concluídas</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="categoryFilter" className="mr-2 text-sm font-medium text-gray-700">Categoria:</label>
                  <select 
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="todos">Todas</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Tarefas */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500">Carregando tarefas...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                 <div className="rounded-md bg-yellow-50 p-4">
                    {/* ... (mensagem nenhuma tarefa encontrada existente) ... */}
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
                        <h3 className="text-sm font-medium text-yellow-800">Nenhuma tarefa encontrada</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>Nenhuma tarefa corresponde aos filtros selecionados ou você ainda não criou nenhuma tarefa.</p>
                        </div>
                        </div>
                    </div>
                 </div>
              ) : (
                <div className="overflow-hidden bg-white shadow sm:rounded-md">
                  {/* Usar o componente TaskItem aqui */}
                  <ul className="divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        categories={categories}
                        getCategoryName={getCategoryName}
                        toggleTaskStatus={toggleTaskStatus}
                        openEditModal={openEditModal}
                        handleDeleteTask={handleDeleteTask}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal para criar/editar tarefa (sem alterações aqui) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  {/* Título */}
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                      Título *
                    </label>
                    <input
                      type="text"
                      id="titulo"
                      {...register('titulo')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.titulo && (
                      <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      id="descricao"
                      rows={3}
                      {...register('descricao')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Data de Vencimento */}
                  <div>
                    <label htmlFor="data_vencimento" className="block text-sm font-medium text-gray-700">
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      id="data_vencimento"
                      {...register('data_vencimento')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Categorias */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categorias</label>
                    <div className="mt-2 space-y-2">
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma categoria disponível.</p>
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
                            <label htmlFor={`category-${category.id}`} className="ml-3 text-sm text-gray-700">
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
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
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
