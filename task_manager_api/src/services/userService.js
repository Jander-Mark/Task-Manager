const { getFirestoreDb } = require("../config/firebase");
// Não precisamos mais de bcrypt ou config aqui
// const bcrypt = require("bcryptjs");
// const config = require("../config/config");

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
 * Cria ou atualiza um novo documento de usuário no Firestore.
 * A senha NÃO é armazenada aqui. O ID do documento será o UID do Firebase Auth.
 * @param {string} uid - O UID vindo do Firebase Auth.
 * @param {object} userData - Dados do usuário (email, nome).
 * @returns {Promise<object>} Os dados do usuário criado.
 */
const createUser = async (uid, userData) => {
  const { email, nome } = userData;

  // REMOVEMOS A VERIFICAÇÃO DE EMAIL EXISTENTE QUE CAUSAVA O CONFLITO (409)
  // const existingUser = await findUserByEmail(email);
  // if (existingUser) {
  //   throw new Error("Email já registrado");
  // }

  // Usa o UID do Auth como ID do documento
  const newUserRef = usersCollection.doc(uid); 

  const newUserProfile = {
    email,
    nome,
    createdAt: new Date()
  };
  
  // Usa .set() em vez de .add()
  // Isso irá CRIAR o documento se ele não existir,
  // ou ATUALIZAR se ele já existir (mas a chamada de criação de perfil falhou antes).
  // Isso torna a rota segura contra falhas parciais.
  await newUserRef.set(newUserProfile, { merge: true });

  // Retorna os dados do usuário
  return {
    id: uid,
    email,
    nome
  };
};

/**
 * Encontra um usuário pelo seu UID do Firebase Auth.
 * @param {string} userId - O UID do usuário.
 * @returns {Promise<object|null>} Os dados do usuário, ou null se não encontrado.
 */
const findUserById = async (userId) => {
    // Busca o documento usando o UID como ID
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
        return null;
    }
    const userData = userDoc.data();
    // Garante que o hash da senha não seja retornado (embora não deva existir mais)
    delete userData.hashedPassword; 
    return { id: userDoc.id, ...userData };
};


module.exports = {
  findUserByEmail,
  createUser,
  findUserById
};