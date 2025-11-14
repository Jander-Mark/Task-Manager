const { getFirestoreDb } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const config = require("../config/config");

const db = getFirestoreDb();
const usersCollection = db.collection("users");

/**
 * Encontra um usuário pelo email.
 * @param {string} email - O email do usuário.
 * @returns {Promise<object|null>} Os dados do usuário incluindo id, ou null se não encontrado.
 */
const findUserByEmail = async (email) => {
  const snapshot = await usersCollection.where("email", "==", email).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Cria um novo usuário no Firestore.
 * @param {object} userData - Dados do usuário (email, nome, senha).
 * @returns {Promise<object>} Os dados do usuário criado (sem a senha).
 * @throws {Error} Se o email já existir.
 */
const createUser = async (userData) => {
  const { email, nome, senha } = userData;

  // Verifica se o usuário já existe
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email já registrado");
  }

  // Faz o hash da senha
  const hashedPassword = await bcrypt.hash(senha, config.bcryptSaltRounds);

  // Adiciona o usuário ao Firestore
  const newUserRef = await usersCollection.add({
    email,
    nome,
     // Armazena o hash da senha
    createdAt: new Date()
  });

  // Retorna os dados do usuário sem a senha
  return {
    id: newUserRef.id,
    email,
    nome
  };
};

/**
 * Encontra um usuário pelo ID.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|null>} Os dados do usuário (sem a senha), ou null se não encontrado.
 */
const findUserById = async (userId) => {
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
        return null;
    }
    const userData = userDoc.data();
    // Garante que o hash da senha não seja retornado
    delete userData.hashedPassword;
    return { id: userDoc.id, ...userData };
};


module.exports = {
  findUserByEmail,
  createUser,
  findUserById
};

