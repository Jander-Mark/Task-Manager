import api from './api';

export interface Category {
  id: string;
  nome: string;
  usuario_id: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryData {
  nome: string;
}

interface UpdateCategoryData {
  nome: string;
}

// Buscar todas as categorias do usuário
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

// Buscar uma categoria específica por ID
export const getCategoryById = async (categoryId: string): Promise<Category> => {
  const response = await api.get(`/categories/${categoryId}`);
  return response.data;
};

// Criar uma nova categoria
export const createCategory = async (categoryData: CreateCategoryData): Promise<Category> => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

// Atualizar uma categoria existente
export const updateCategory = async (categoryId: string, categoryData: UpdateCategoryData): Promise<Category> => {
  const response = await api.put(`/categories/${categoryId}`, categoryData);
  return response.data;
};

// Excluir uma categoria
export const deleteCategory = async (categoryId: string): Promise<void> => {
  await api.delete(`/categories/${categoryId}`);
};
