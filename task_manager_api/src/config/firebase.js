const admin = require("firebase-admin");
const path = require("path");

// Caminho para o arquivo de credenciais
// Idealmente, o caminho seria configurado via variável de ambiente
const serviceAccountPath = path.join(__dirname, "..", "..", "firebase-credentials.json");

let db;

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
  console.log("Firebase Admin SDK inicializado com sucesso e conexão com Firestore estabelecida.");

} catch (error) {
  console.error("Erro ao inicializar o Firebase Admin SDK:", error);
  // Em uma aplicação real, você pode querer lançar o erro ou lidar com ele de forma mais robusta
  db = null;
}

const getFirestoreDb = () => {
  if (!db) {
    throw new Error("A conexão com o Firestore não foi estabelecida.");
  }
  return db;
};

module.exports = { admin, getFirestoreDb };

