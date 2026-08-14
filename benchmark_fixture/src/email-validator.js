// BUG: Validação de email incorreta - não verifica formato correto
function validateEmail(email) {
  if (!email) return false;
  // BUG: Apenas verifica se tem @, não valida formato completo
  return email.includes('@');
}

module.exports = validateEmail;
