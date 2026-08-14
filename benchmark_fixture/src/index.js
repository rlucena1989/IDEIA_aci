const express = require('express');
const validateEmail = require('./email-validator');
const paginate = require('./pagination');

const app = express();
app.use(express.json());

// Endpoint de validação de email
app.post('/api/validate-email', (req, res) => {
  const { email } = req.body;
  const isValid = validateEmail(email);
  res.json({ valid: isValid });
});

// Endpoint de lista com paginação
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const users = generateMockUsers(100);
  const result = paginate(users, parseInt(page), parseInt(limit));
  res.json(result);
});

function generateMockUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    });
  }
  return users;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
