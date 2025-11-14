const { getFirestoreDb } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

const db = getFirestoreDb();
const categoriesCollection = db.collection("categories");
const tasksCollection = db.collection("tasks");

/**
 * Cria uma nova categoria para um usuário específico.
 * @param {object} categoryData - Dados da categoria (nome).
 * @param {string} userId - O ID do usuário que está criando a categoria.
 * @returns {Promise<object>} Os dados da categoria criada, incluindo seu ID.
 * @throws {Error} Se uma categoria com o mesmo nome já existir para o usuário.
 */
const createCategory = async (categoryData, userId) => {
  const { nome } = categoryData;

  // Verifica se já existe uma categoria com o mesmo nome para este usuário
  const snapshot = await categoriesCollection
    .where("usuario_id", "==", userId)
    .where("nome", "==", nome)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    throw new Error(`Categoria com nome "${nome}" já existe para este usuário.`);
  }

  const newCategoryData = {
    usuario_id: userId,
    nome,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const categoryRef = await categoriesCollection.add(newCategoryData);
  return { id: categoryRef.id, ...newCategoryData };
};

/**
 * Busca uma categoria pelo seu ID, garantindo que pertença ao usuário especificado.
 * @param {string} categoryId - O ID da categoria.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|null>} Dados da categoria ou null se não encontrada ou não pertencer ao usuário.
 */
const findCategoryById = async (categoryId, userId) => {
  const categoryDoc = await categoriesCollection.doc(categoryId).get();

  if (!categoryDoc.exists) {
    return null;
  }

  const categoryData = categoryDoc.data();

  // Verifica a propriedade
  if (categoryData.usuario_id !== userId) {
    return null; // Ou lance um erro de autorização
  }

  return { id: categoryDoc.id, ...categoryData };
};

/**
 * Busca todas as categorias de um usuário específico.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<Array<object>>} Um array de objetos de categoria.
 */
const findCategoriesByUser = async (userId) => {
  const snapshot = await categoriesCollection.where("usuario_id", "==", userId).orderBy("nome", "asc").get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Atualiza uma categoria existente, garantindo que pertença ao usuário especificado.
 * @param {string} categoryId - O ID da categoria.
 * @param {object} updateData - Dados para atualizar (apenas os campos fornecidos serão atualizados, ex: { nome }).
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|null>} Dados da categoria atualizada ou null se não encontrada/não autorizada.
 * @throws {Error} Se o novo nome já existir para o usuário.
 */
const updateCategory = async (categoryId, updateData, userId) => {
  const categoryRef = categoriesCollection.doc(categoryId);
  const categoryDoc = await categoryRef.get();

  if (!categoryDoc.exists) {
    return null; // Categoria não encontrada.
  }

  const currentCategoryData = categoryDoc.data();
  if (currentCategoryData.usuario_id !== userId) {
    return null; // Não autorizado.
  }

  const { nome } = updateData;

  // Se o nome está sendo atualizado, verifica conflitos
  if (nome !== undefined && nome !== currentCategoryData.nome) {
    const snapshot = await categoriesCollection
      .where("usuario_id", "==", userId)
      .where("nome", "==", nome)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      throw new Error(`Categoria com nome "${nome}" já existe para este usuário.`);
    }
  }

  // Prepara o objeto de atualização
  const dataToUpdate = { ...updateData, updatedAt: new Date() };
  Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

  if (Object.keys(dataToUpdate).length === 1 && 'updatedAt' in dataToUpdate) {
      return { id: categoryDoc.id, ...currentCategoryData }; 
  }

  await categoryRef.update(dataToUpdate);

  const updatedDoc = await categoryRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

/**
 * Exclui uma categoria, garantindo que pertença ao usuário especificado.
 * NOTA: Isso não remove automaticamente o ID da categoria das tarefas associadas.
 * @param {string} categoryId - O ID da categoria.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<boolean>} True se excluído com sucesso, false caso contrário.
 */
const deleteCategory = async (categoryId, userId) => {
  const categoryRef = categoriesCollection.doc(categoryId);
  const categoryDoc = await categoryRef.get();

  if (!categoryDoc.exists) {
    return false; 
  }

  if (categoryDoc.data().usuario_id !== userId) {
    return false;
  }


  await categoryRef.delete();
  return true;
};

module.exports = {
  createCategory,
  findCategoryById,
  findCategoriesByUser,
  updateCategory,
  deleteCategory,
};

