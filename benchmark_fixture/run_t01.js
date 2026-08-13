const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuração
const FIXTURE_DIR = __dirname;
const RESULTS_DIR = path.join(FIXTURE_DIR, 'results');
const TASK_ID = 'T01';
const TOOL = 'OpenCode'; // Alterar para ferramenta usada
const MODEL = 'DeepSeek V4 Flash';
const PROVIDER = 'DeepSeek';

// Criar diretório de resultados
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Registrar hash do commit (simulado para fixture)
const commitHash = execSync('git rev-parse HEAD', { cwd: FIXTURE_DIR, encoding: 'utf8' }).trim();

// Executar testes baseline
console.log('Executando testes baseline...');
try {
  execSync('npm test', { cwd: FIXTURE_DIR, stdio: 'inherit' });
} catch (error) {
  console.log('Testes baseline falharam (esperado para fixture com bug)');
}

// Iniciar registro de métricas
const startedAt = new Date().toISOString();
console.log(`\n=== T01: Compreensão (read-only) ===`);
console.log(`Fixture: ${FIXTURE_DIR}`);
console.log(`Commit: ${commitHash}`);
console.log(`Iniciado em: ${startedAt}`);
console.log(`\nInstruções:`);
console.log(`1. Iniciar ferramenta ${TOOL} apontando para ${FIXTURE_DIR}`);
console.log(`2. Pedir para explicar estrutura e fluxo principal`);
console.log(`3. Registrar resposta da ferramenta`);
console.log(`4. Verificar que nenhum arquivo foi alterado`);
console.log(`\nPressione Enter quando terminar...`);

// Aguardar intervenção manual
process.stdin.once('data', () => {
  const finishedAt = new Date().toISOString();
  const durationMs = new Date(finishedAt) - new Date(startedAt);
  
  // Registrar resultado
  const result = {
    runId: `run-${Date.now()}`,
    taskId: TASK_ID,
    tool: TOOL,
    model: MODEL,
    provider: PROVIDER,
    startedAt,
    finishedAt,
    durationMs,
    status: 'success', // 'success', 'failure', 'timeout', 'error'
    cost: 0, // Calcular se aplicável
    tokensInput: 0,
    tokensOutput: 0,
    interventions: 0,
    score: 1, // 0-1, calculado após revisão
    reason: null
  };
  
  // Salvar resultado
  const resultPath = path.join(RESULTS_DIR, `t01-${Date.now()}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  
  console.log(`\nResultado salvo em: ${resultPath}`);
  console.log(`Duração: ${durationMs}ms`);
  console.log(`\n=== T01 concluído ===`);
  
  process.exit(0);
});

console.log('\nAguardando conclusão manual...');
