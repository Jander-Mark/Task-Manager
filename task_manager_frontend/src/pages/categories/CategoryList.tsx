import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '../../services/categoryService';
import { useBackground } from '@/contexts/BackgroundProvider'; // <-- IMPORTAR
import { cn } from '@/lib/utils'; // <-- IMPORTAR

// Interface para o Timestamp do Firestore
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}
// Interface de Categoria (já estava no seu original)
// export interface Category { // <--- Removido 'export' para evitar conflito
//   id: string;
//   nome: string;
//   usuario_id: string;
//   createdAt: string;
//   updatedAt: string;
// }

// Esquema de validação com Zod
const categorySchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

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
    return 'Data inválida'; // Formato desconhecido
  }

  // Verifica se a data resultante é válida
  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  // Adiciona fuso horário para evitar problemas de dia anterior
  const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  return adjustedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// *** FUNÇÃO DE HELPER DE DATA ***
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

const CategoryList: React.FC = () => {
  const { background } = useBackground(); // <-- ADICIONADO
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        // Ordena por data de criação
        setCategories(data.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)));
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // *** LÓGICA DE CRUD RESTAURADA ***

  // Abrir modal para criar nova categoria
  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ nome: '' });
    setIsModalOpen(true);
  };

  // Abrir modal para editar categoria existente
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setValue('nome', category.nome);
    setIsModalOpen(true);
  };

  // Fechar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  // Enviar formulário (criar ou editar categoria)
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        // Editar categoria existente
        const updatedCategory = await updateCategory(editingCategory.id, data);
        setCategories(categories.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat)));
      } else {
        // Criar nova categoria
        const newCategory = await createCategory(data);
        // Adiciona a nova categoria no topo
        setCategories([newCategory, ...categories]);
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar categoria');
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar tarefas associadas.')) {
      try {
        await deleteCategory(categoryId);
        setCategories(categories.filter(cat => cat.id !== categoryId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao excluir categoria');
      }
    }
  };

  return (
    // Nav e Fundo removidos - agora no AppLayout
    <div className="py-10">
      <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                {/* **** TÍTULO CORRIGIDO **** */}
                <h1 className={cn(
                  "text-3xl font-bold leading-tight",
                  background === 'default' 
                    ? "text-gray-900 dark:text-gray-100" 
                    : "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]"
                )}>
                  Categorias
                </h1>
              </div>
              {/* *** BOTÃO RESTAURADO *** */}
              <div className="mt-4 flex md:ml-4 md:mt-0">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Nova Categoria
                </button>
              </div>
            </div>
          </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {/* *** LÓGICA DE ERRO RESTAURADA *** */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20 dark:border dark:border-red-400/30">
                    <div className="flex">
                      <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-10a1 1 0 10-2 0v4a1 1 0 102 0V8zm-1-3a1 1 0 00-1 1v.01a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                          />
                      </svg>
                      </div>
                      <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erro</h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                          <p>{error}</p>
                      </div>
                      </div>
                  </div>
              </div>
            )}

            {/* Lista de Categorias - CORRIGIDA (card sólido) */}
            <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-zinc-900">
              <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Carregando categorias...</p>
                  </div>
                ) : categories.length === 0 ? (
                  // *** LÓGICA DE AVISO RESTAURADA ***
                  <div className="rounded-md bg-yellow-50 p-4 m-4 dark:bg-yellow-900/20 dark:border dark:border-yellow-400/30">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Nenhuma categoria encontrada</h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                          <p>Você ainda não criou nenhuma categoria. Clique em "Nova Categoria" para começar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  categories.map((category) => (
                    <li key={category.id}>
                      <div className="block hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">{category.nome}</div>
                            <div className="ml-2 flex flex-shrink-0">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                Criada em: {formatFirestoreTimestamp(category.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              {/* Espaço para detalhes futuros */}
                            </div>
                            {/* *** BOTÕES RESTAURADOS *** */}
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(category)}
                                  className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 dark:ring-zinc-600 dark:hover:bg-zinc-600"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(category.id)}
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
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* *** MODAL RESTAURADO (com estilos dark mode) *** */}
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
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="nome"
                      {...register('nome')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nome.message}</p>
                    )}
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    >
                      {editingCategory ? 'Salvar' : 'Criar'}
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

export default CategoryList;