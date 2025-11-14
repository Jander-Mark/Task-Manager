require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  firebaseCredentialsPath: './firebase-credentials.json', // Pode ser ajustado se necessário
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  bcryptSaltRounds: 10 // Número de rounds para o bcrypt
};

