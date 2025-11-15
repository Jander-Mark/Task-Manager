const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "..", "..", "firebase-credentials.json");

let db;
let auth; // <-- Adicione esta linha

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
  auth = admin.auth(); // <-- Adicione esta linha
  console.log("Firebase Admin SDK inicializado com sucesso. Firestore e Auth prontos.");

} catch (error) {
  console.error("Erro ao inicializar o Firebase Admin SDK:", error);
  db = null;
  auth = null; // <-- Adicione esta linha
}

const getFirestoreDb = () => {
  if (!db) {
    throw new Error("A conexão com o Firestore não foi estabelecida.");
  }
  return db;
};

// Nova função para obter o serviço de Autenticação
const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error("A conexão com o Firebase Auth não foi estabelecida.");
  }
  return auth;
}

module.exports = { admin, getFirestoreDb, getFirebaseAuth }; // <-- Exporte getFirebaseAuth