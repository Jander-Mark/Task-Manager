require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Teste de rota simples
// Esta rota é apenas para verificar se o servidor está funcionando corretamente
app.get("/api/test", (req, res) => {
  console.log("Accessed /api/test in v2");
  res.status(200).json({ message: "Test route in v2 is working!" });
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Task Manager API v2 (minimal)!" });
});

app.listen(PORT, () => {
  console.log(`Server v2 (minimal) listening on port ${PORT}`);
});

module.exports = app;

