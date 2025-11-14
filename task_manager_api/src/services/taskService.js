const { getFirestoreDb } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore"); // Para operações de array

const db = getFirestoreDb();
const tasksCollection = db.collection("tasks");

/**
 * Cria uma nova tarefa para um usuário específico.
 * @param {object} taskData - Dados da tarefa (titulo, descricao, data_vencimento, status, categoria_ids).
 * @param {string} userId - O ID do usuário que está criando a tarefa.
 * @returns {Promise<object>} Os dados da tarefa criada, incluindo seu ID.
 */
const createTask = async (taskData, userId) => {
  const { titulo, descricao, data_vencimento, status = 'pendente', categoria_ids = [] } = taskData;

  const newTaskData = {
    usuario_id: userId,
    titulo,
    descricao: descricao || null,
    data_vencimento: data_vencimento || null,
    status,
    categoria_ids, // Armazena como array de IDs
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const taskRef = await tasksCollection.add(newTaskData);
  return { id: taskRef.id, ...newTaskData };
};

/**
 * Busca uma tarefa pelo seu ID, garantindo que pertença ao usuário especificado.
 * @param {string} taskId - O ID da tarefa.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|null>} Dados da tarefa ou null se não encontrada ou não pertencer ao usuário.
 */
const findTaskById = async (taskId, userId) => {
  const taskDoc = await tasksCollection.doc(taskId).get();

  if (!taskDoc.exists) {
    return null;
  }

  const taskData = taskDoc.data();

  // Verifica a propriedade
  if (taskData.usuario_id !== userId) {
    return null; // Ou lance um erro de autorização
  }

  return { id: taskDoc.id, ...taskData };
};

/**
 * Busca todas as tarefas de um usuário específico.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<Array<object>>} Um array de objetos de tarefas.
 */
const findTasksByUser = async (userId) => {
  const snapshot = await tasksCollection.where("usuario_id", "==", userId).orderBy("createdAt", "desc").get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Atualiza uma tarefa existente, garantindo que pertença ao usuário especificado.
 * @param {string} taskId - O ID da tarefa.
 * @param {object} updateData - Dados para atualizar (apenas os campos fornecidos serão atualizados).
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|null>} Dados da tarefa atualizada ou null se não encontrada/não autorizada.
 */
const updateTask = async (taskId, updateData, userId) => {
  const taskRef = tasksCollection.doc(taskId);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    return null;
  }

  const currentTaskData = taskDoc.data();
  if (currentTaskData.usuario_id !== userId) {
    return null;
  }

  // Prepare update object, excluding undefined fields and adding updatedAt
  const dataToUpdate = { ...updateData, updatedAt: new Date() };
  Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

  if (Object.keys(dataToUpdate).length === 1 && 'updatedAt' in dataToUpdate) {
      // Se apenas updatedAt estiver presente, não há alteração real de dados, retorne os dados atuais
      return { id: taskDoc.id, ...currentTaskData };
  }

  await taskRef.update(dataToUpdate);

  // Retorna os dados da tarefa atualizada
  const updatedDoc = await taskRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

/**
 * Exclui uma tarefa, garantindo que pertença ao usuário especificado.
 * @param {string} taskId - O ID da tarefa.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<boolean>} True se excluída com sucesso, false caso contrário.
 */
const deleteTask = async (taskId, userId) => {
  const taskRef = tasksCollection.doc(taskId);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    return false;
  }

  if (taskDoc.data().usuario_id !== userId) {
    return false;
  }

  await taskRef.delete();
  return true;
};

module.exports = {
  createTask,
  findTaskById,
  findTasksByUser,
  updateTask,
  deleteTask,
};

