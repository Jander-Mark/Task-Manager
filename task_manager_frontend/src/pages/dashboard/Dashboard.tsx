import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasks } from '../../services/taskService';
import { getCategories } from '../../services/categoryService';
import { useBackground } from '@/contexts/BackgroundProvider'; // Para o título
import { cn } from '@/lib/utils'; // Para o título

// Interfaces (mantidas)
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}
interface Task {
  id: string;
  titulo: string;
  descricao: string | null;
  data_vencimento: string | null;
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

// Funções de data (mantidas)
const formatFirestoreTimestamp = (timestamp: FirestoreTimestamp | string | Date | null): string => {
  if (!timestamp) return 'Data inválida';
  let date: Date;
  if (typeof timestamp === 'string') {
     if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
        date = new Date(`${timestamp}T00:00:00`);
    } else {
        date = new Date(timestamp);
    }
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && typeof timestamp._seconds === 'number') {
    date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  } else {
    return 'Data inválida'; 
  }
  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

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

// *** 1. NOVA FUNÇÃO HELPER ***
// Converte a data de vencimento (string YYYY-MM-DD) para milissegundos
const getDueDateMillis = (dateString: string | null): number | null => {
  if (!dateString) {
    return null; // Sem data de vencimento
  }
  try {
    // Usa T00:00:00 para garantir que a data seja tratada no fuso local
    const date = new Date(`${dateString}T00:00:00`);
    if (isNaN(date.getTime())) {
      return null; // String de data inválida
    }
    return date.getTime();
  } catch (e) {
    return null;
  }
};

// *** (Funções de data de TaskList.tsx) ***
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

const wasCompletedLate = (task: Task): boolean => {
  if (task.status === 'pendente' || !task.data_vencimento || !task.updatedAt) {
    return false;
  }
  try {
    const completionDate = new Date(getTimestampMillis(task.updatedAt));
    completionDate.setHours(0, 0, 0, 0); 
    const dueDate = new Date(`${task.data_vencimento}T00:00:00`);
    return completionDate > dueDate;
  } catch (e) {
    return false;
  }
};


const Dashboard: React.FC = () => {
  const { background } = useBackground(); 
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

  // *** 2. LÓGICA DE "TAREFAS RECENTES" MODIFICADA ***
  const urgentTasks = [...tasks]
    .filter(task => task.status === 'pendente') // 1. Apenas tarefas pendentes
    .sort((a, b) => {
      const dueA = getDueDateMillis(a.data_vencimento);
      const dueB = getDueDateMillis(b.data_vencimento);

      // Coloca tarefas sem data de vencimento no final
      if (dueA === null) return 1;
      if (dueB === null) return -1;

      // Ordena pela data de vencimento (mais próxima/atrasada primeiro)
      return dueA - dueB;
    })
    .slice(0, 5); // Pega as 5 mais urgentes

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className={cn(
            "text-3xl font-bold leading-tight",
            background === 'default' 
              ? "text-gray-900 dark:text-gray-100" 
              : "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]"
          )}>
            Dashboard
          </h1>
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

            {/* Cards de Resumo (Mantidos) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              
              <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-900">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 rounded-md bg-blue-500 p-3">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tarefas Pendentes</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {loading ? '--' : pendingTasksCount}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 dark:bg-zinc-800">
                  <div className="text-sm">
                    <Link to="/tasks" className="font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      Ver todas
                    </Link>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-900">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tarefas Concluídas</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {loading ? '--' : completedTasksCount}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 dark:bg-zinc-800">
                  <div className="text-sm">
                    <Link to="/tasks" className="font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      Ver todas
                    </Link>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-900">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 rounded-md bg-purple-500 p-3">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Categorias</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {loading ? '--' : categoriesCount}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 dark:bg-zinc-800">
                  <div className="text-sm">
                    <Link to="/categories" className="font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      Ver todas
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* *** 3. LISTA DE TAREFAS ATUALIZADA *** */}
            <div className="mt-8 overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-900">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Tarefas Mais Urgentes {/* <-- Título atualizado */}
                </h3>
                <div className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Carregando tarefas...</p>
                    </div>
                  ) : urgentTasks.length === 0 ? ( // <-- Variável atualizada
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma tarefa pendente encontrada. Bom trabalho! {/* <-- Mensagem atualizada */}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                      {urgentTasks.map((task) => { // <-- Variável atualizada
                        // Copiamos a lógica de exibição de data para cá
                        const isPendente = task.status === 'pendente';
                        const isAtrasada = isTaskOverdue(task);
                        
                        return (
                          <li key={task.id} className="py-4">
                            <div className="flex space-x-3">
                              <div className="flex-1 space-y-1 min-w-0"> 
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium truncate overflow-hidden break-all">
                                    <Link 
                                      to={`/tasks`} 
                                      className="text-blue-600 dark:text-blue-400 hover:underline"
                                      title={task.titulo} 
                                    >
                                      {task.titulo}
                                    </Link>
                                  </h4>
                                  
                                  {/* Lógica de Data (simplificada para o dashboard) */}
                                  <div className="ml-4 flex-shrink-0 whitespace-nowrap text-right">
                                    {task.data_vencimento && (
                                      <p className={cn(
                                        "text-sm",
                                        isAtrasada && isPendente
                                          ? "text-red-600 font-semibold"
                                          : "text-gray-500 dark:text-gray-400"
                                      )}>
                                        Vence: {formatFirestoreTimestamp(task.data_vencimento)}
                                      </p>
                                    )}
                                    {isAtrasada && isPendente && (
                                      <p className="text-xs font-semibold text-red-600">
                                        (Em atraso)
                                      </p>
                                    )}
                                  </div>

                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 break-all overflow-hidden dark:text-gray-400" style={{ wordBreak: 'break-all' }}>
                                  {task.descricao || 'Sem descrição'}
                                </p>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;