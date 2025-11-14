import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getTasks } from '../../services/taskService';
import { getCategories } from '../../services/categoryService';

// Interface para o Timestamp do Firestore
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// Interface para Task, ajustando createdAt/updatedAt
interface Task {
  id: string;
  titulo: string;
  descricao: string | null;
  data_vencimento: string | null;
  status: 'pendente' | 'concluída';
  categoria_ids: string[];
  usuario_id: string;
  createdAt: FirestoreTimestamp | string | Date; // Pode ser Timestamp, string ou Date
  updatedAt: FirestoreTimestamp | string | Date;
}

// Interface para Category, ajustando createdAt/updatedAt
interface Category {
  id: string;
  nome: string;
  usuario_id: string;
  createdAt: FirestoreTimestamp | string | Date;
  updatedAt: FirestoreTimestamp | string | Date;
}

// Função helper para converter e formatar Timestamp do Firestore ou outras datas
const formatFirestoreTimestamp = (timestamp: FirestoreTimestamp | string | Date | null): string => {
  if (!timestamp) return 'Data inválida';

  let date: Date;

  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
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

  // Formata a data válida
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Função helper para obter milissegundos de diferentes tipos de data para ordenação
const getTimestampMillis = (timestamp: FirestoreTimestamp | string | Date | null): number => {
    if (!timestamp) return 0;

    let date: Date;

    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && typeof timestamp._seconds === 'number') {
      date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    } else {
      return 0; // Retorna 0 para formatos desconhecidos ou inválidos
    }

    return isNaN(date.getTime()) ? 0 : date.getTime();
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksData, categoriesData] = await Promise.all([
          getTasks(),
          getCategories(),
        ]);
        setTasks(tasksData);
        setCategories(categoriesData);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError(err.response?.data?.message || 'Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingTasksCount = tasks.filter(task => task.status === 'pendente').length;
  const completedTasksCount = tasks.filter(task => task.status === 'concluída').length;
  const categoriesCount = categories.length;

  // Ordenar tarefas recentes usando a função helper
  const recentTasks = [...tasks]
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        {/* ... (código da navegação) ... */}
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">Gerenciador de Tarefas</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/tasks"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="mr-4 text-sm font-medium text-gray-700">Olá, {user?.nome}</span>
                  <button
                    onClick={logout}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Card Tarefas Pendentes */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-blue-500 p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">Tarefas Pendentes</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {loading ? '--' : pendingTasksCount}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link to="/tasks" className="font-medium text-blue-700 hover:text-blue-900">
                        Ver todas
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Card Tarefas Concluídas */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                         <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">Tarefas Concluídas</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {loading ? '--' : completedTasksCount}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link to="/tasks" className="font-medium text-blue-700 hover:text-blue-900">
                        Ver todas
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Card Categorias */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-purple-500 p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">Categorias</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {loading ? '--' : categoriesCount}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link to="/categories" className="font-medium text-blue-700 hover:text-blue-900">
                        Ver todas
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Tarefas Recentes */}
              <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Tarefas Recentes</h3>
                  <div className="mt-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-gray-500">Carregando tarefas...</p>
                      </div>
                    ) : recentTasks.length === 0 ? (
                      <p className="text-gray-500">Nenhuma tarefa recente encontrada.</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {recentTasks.map((task) => (
                          <li key={task.id} className="py-4">
                            <div className="flex space-x-3">
                              {/* Container principal do conteúdo da tarefa, com min-width para evitar colapso */}
                              <div className="flex-1 space-y-1 min-w-0"> 
                                <div className="flex items-center justify-between">
                                  {/* Título com truncamento e quebra forçada */}
                                  <h4 className="text-sm font-medium truncate overflow-hidden break-all">
                                    <Link 
                                      to={`/tasks`} 
                                      className={`hover:underline ${task.status === 'concluída' ? 'text-gray-500 line-through' : 'text-blue-600'}`}
                                      title={task.titulo} // Adiciona tooltip
                                    >
                                      {task.titulo}
                                    </Link>
                                  </h4>
                                  {/* Data (não encolher) */}
                                  <p className="text-sm text-gray-500 ml-4 flex-shrink-0 whitespace-nowrap">
                                    {formatFirestoreTimestamp(task.createdAt)}
                                  </p>
                                </div>
                                {/* Descrição com truncamento de 2 linhas e quebra forçada */}
                                <p className="text-sm text-gray-500 line-clamp-2 break-all overflow-hidden" style={{ wordBreak: 'break-all' }}>
                                  {task.descricao || 'Sem descrição'}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

