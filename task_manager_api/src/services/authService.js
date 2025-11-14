const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { findUserByEmail } = require("./userService");
const config = require("../config/config");

/**
 * Autentica um usuário pelo email e senha.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<object|null>} Dados do usuário (id, email, nome) se a autenticação for bem-sucedida, caso contrário null.
 */
const authenticateUser = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user || !user.hashedPassword) {
    // Usuário não encontrado ou hash da senha está ausente (isso não deveria acontecer para usuários registrados)
    return null;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);

  if (!isPasswordMatch) {
    return null; // Passwords don't match
  }

  // Retorna os dados do usuário necessários para o payload do token (excluindo a senha)
  return {
    id: user.id,
    email: user.email,
    nome: user.nome
  };
};

/**
 * Gera um token de acesso JWT para um usuário.
 * @param {object} user - Dados do usuário (deve incluir id).
 * @returns {string} O JWT gerado.
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    // Você pode adicionar outras informações relevantes, como funções (roles), se necessário
  };

  const options = {
    expiresIn: config.jwt.expiresIn,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

module.exports = {
  authenticateUser,
  generateToken,
};

