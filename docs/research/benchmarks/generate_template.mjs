#!/usr/bin/env node

/**
 * Gerador de templates de JSON para benchmark
 * Uso: node generate_template.mjs <taskId> <tool> <model>
 */

const fs = require('fs');
const path = require('path');

const tasks = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10'];
const tools = ['opencode', 'freebuff', 'cursor', 'windsurf'];

function generateTemplate(taskId, tool, model) {
  const runId = `${taskId}_${tool}_${Date.now()}`;
  
  const template = {
    runId: runId,
    taskId: taskId,
    tool: tool,
    toolVersion: "",
    model: model,
    provider: "",
    baseCommit: "",
    workspace: "isolated-copy",
    startedAt: "",
    finishedAt: "",
    status: "success|partial|failed|rolled_back",
    humanInterventions: 0,
    toolCalls: 0,
    retries: 0,
    inputTokens: 0,
    outputTokens: 0,
    cost: { amount: 0, currency: "USD" },
    testsBefore: { passed: 0, failed: 0 },
    testsAfter: { passed: 0, failed: 0 },
    acceptanceTests: { passed: 0, failed: 0 },
    lintErrors: 0,
    securityFindings: { critical: 0, high: 0, medium: 0, low: 0 },
    filesChanged: [],
    outOfScopeChanges: [],
    rollbackPerformed: false,
    reviewScore: 0,
    notes: ""
  };
  
  return template;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso: node generate_template.mjs <taskId> <tool> <model>');
    console.log('');
    console.log('Tarefas disponíveis:', tasks.join(', '));
    console.log('Ferramentas disponíveis:', tools.join(', '));
    console.log('');
    console.log('Exemplo: node generate_template.mjs T01 opencode gpt-4o');
    console.log('Exemplo: node generate_template.mjs all opencode gpt-4o (gera templates para todas as tarefas)');
    process.exit(1);
  }
  
  const taskId = args[0];
  const tool = args[1] || 'opencode';
  const model = args[2] || 'gpt-4o';
  
  if (taskId === 'all') {
    // Gerar templates para todas as tarefas
    for (const t of tasks) {
      const template = generateTemplate(t, tool, model);
      const filename = `results_${t}_${tool}_${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(template, null, 2));
      console.log(`✅ Template gerado: ${filename}`);
    }
  } else {
    if (!tasks.includes(taskId)) {
      console.error(`❌ Tarefa inválida: ${taskId}`);
      console.error(`Tarefas disponíveis: ${tasks.join(', ')}`);
      process.exit(1);
    }
    
    const template = generateTemplate(taskId, tool, model);
    const filename = `results_${taskId}_${tool}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(template, null, 2));
    console.log(`✅ Template gerado: ${filename}`);
  }
}

main();
