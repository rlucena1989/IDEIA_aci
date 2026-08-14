const validateEmail = require('./email-validator');

describe('validateEmail', () => {
  test('deve retornar true para email válido', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  test('deve retornar false para email sem @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  test('deve retornar false para email vazio', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('deve retornar false para null', () => {
    expect(validateEmail(null)).toBe(false);
  });

  // Teste de regressão para o bug
  test('deve retornar false para email com formato inválido (tem @ mas formato errado)', () => {
    expect(validateEmail('@example.com')).toBe(false); // BUG atual retorna true
    expect(validateEmail('user@')).toBe(false); // BUG atual retorna true
    expect(validateEmail('user@.com')).toBe(false); // BUG atual retorna true
  });
});
