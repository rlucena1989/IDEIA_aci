#!/usr/bin/env node

/**
 * Consolidador de resultados do benchmark
 * Uso: node consolidate_results.mjs results_*.json
 */

const fs = require('fs');
const path = require('path');

function loadResults(pattern) {
  const files = fs.readdirSync('.').filter(f => f.match(pattern));
  const results = [];
  
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      results.push(data);
    } catch (e) {
      console.error(`❌ Erro ao ler ${file}: ${e.message}`);
    }
  }
  
  return results;
}

function calculateMetrics(results) {
  const metrics = {
    totalRuns: results.length,
    successfulRuns: 0,
    partialRuns: 0,
    failedRuns: 0,
    rolledBackRuns: 0,
    totalCost: 0,
    totalDuration: 0,
    totalTokens: 0,
    totalInterventions: 0,
    totalRetries: 0,
    byTask: {},
    byTool: {},
    byStatus: {}
  };
  
  for (const result of results) {
    // Contagem por status
    metrics.byStatus[result.status] = (metrics.byStatus[result.status] || 0) + 1;
    
    if (result.status === 'success') metrics.successfulRuns++;
    if (result.status === 'partial') metrics.partialRuns++;
    if (result.status === 'failed') metrics.failedRuns++;
    if (result.status === 'rolled_back') metrics.rolledBackRuns++;
    
    // Custo
    metrics.totalCost += result.cost.amount;
    
    // Duração
    if (result.startedAt && result.finishedAt) {
      const start = new Date(result.startedAt);
      const end = new Date(result.finishedAt);
      metrics.totalDuration += (end - start) / 1000; // segundos
    }
    
    // Tokens
    metrics.totalTokens += result.inputTokens + result.outputTokens;
    
    // Intervenções
    metrics.totalInterventions += result.humanInterventions;
    
    // Retries
    metrics.totalRetries += result.retries;
    
    // Por tarefa
    metrics.byTask[result.taskId] = metrics.byTask[result.taskId] || {
      count: 0,
      successful: 0,
      totalCost: 0,
      totalDuration: 0
    };
    metrics.byTask[result.taskId].count++;
    if (result.status === 'success') metrics.byTask[result.taskId].successful++;
    metrics.byTask[result.taskId].totalCost += result.cost.amount;
    if (result.startedAt && result.finishedAt) {
      const start = new Date(result.startedAt);
      const end = new Date(result.finishedAt);
      metrics.byTask[result.taskId].totalDuration += (end - start) / 1000;
    }
    
    // Por ferramenta
    metrics.byTool[result.tool] = metrics.byTool[result.tool] || {
      count: 0,
      successful: 0,
      totalCost: 0,
      totalDuration: 0
    };
    metrics.byTool[result.tool].count++;
    if (result.status === 'success') metrics.byTool[result.tool].successful++;
    metrics.byTool[result.tool].totalCost += result.cost.amount;
    if (result.startedAt && result.finishedAt) {
      const start = new Date(result.startedAt);
      const end = new Date(result.finishedAt);
      metrics.byTool[result.tool].totalDuration += (end - start) / 1000;
    }
  }
  
  return metrics;
}

function generateReport(metrics) {
  const report = {
    summary: {
      totalRuns: metrics.totalRuns,
      successRate: ((metrics.successfulRuns / metrics.totalRuns) * 100).toFixed(2) + '%',
      partialRate: ((metrics.partialRuns / metrics.totalRuns) * 100).toFixed(2) + '%',
      failureRate: ((metrics.failedRuns / metrics.totalRuns) * 100).toFixed(2) + '%',
      rollbackRate: ((metrics.rolledBackRuns / metrics.totalRuns) * 100).toFixed(2) + '%',
      totalCost: '$' + metrics.totalCost.toFixed(2),
      avgCostPerRun: '$' + (metrics.totalCost / metrics.totalRuns).toFixed(2),
      avgCostPerSuccess: metrics.successfulRuns > 0 ? '$' + (metrics.totalCost / metrics.successfulRuns).toFixed(2) : 'N/A',
      totalDuration: (metrics.totalDuration / 60).toFixed(2) + ' min',
      avgDuration: (metrics.totalDuration / metrics.totalRuns / 60).toFixed(2) + ' min',
      totalTokens: metrics.totalTokens,
      avgTokensPerRun: Math.round(metrics.totalTokens / metrics.totalRuns),
      avgInterventions: (metrics.totalInterventions / metrics.totalRuns).toFixed(2),
      avgRetries: (metrics.totalRetries / metrics.totalRuns).toFixed(2)
    },
    byTask: {},
    byTool: {}
  };
  
  // Por tarefa
  for (const [taskId, data] of Object.entries(metrics.byTask)) {
    report.byTask[taskId] = {
      count: data.count,
      successRate: ((data.successful / data.count) * 100).toFixed(2) + '%',
      avgCost: '$' + (data.totalCost / data.count).toFixed(2),
      avgDuration: (data.totalDuration / data.count / 60).toFixed(2) + ' min'
    };
  }
  
  // Por ferramenta
  for (const [tool, data] of Object.entries(metrics.byTool)) {
    report.byTool[tool] = {
      count: data.count,
      successRate: ((data.successful / data.count) * 100).toFixed(2) + '%',
      avgCost: '$' + (data.totalCost / data.count).toFixed(2),
      avgDuration: (data.totalDuration / data.count / 60).toFixed(2) + ' min'
    };
  }
  
  return report;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso: node consolidate_results.mjs <pattern>');
    console.log('');
    console.log('Exemplo: node consolidate_results.mjs "results_*.json"');
    process.exit(1);
  }
  
  const pattern = args[0];
  
  console.log('📊 Carregando resultados...');
  const results = loadResults(pattern);
  console.log(`✅ ${results.length} resultados carregados`);
  
  console.log('📊 Calculando métricas...');
  const metrics = calculateMetrics(results);
  
  console.log('📊 Gerando relatório...');
  const report = generateReport(metrics);
  
  const outputFile = `consolidated_report_${Date.now()}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`✅ Relatório salvo: ${outputFile}`);
  
  // Imprimir resumo
  console.log('\n📋 Resumo:');
  console.log(`Total de execuções: ${report.summary.totalRuns}`);
  console.log(`Taxa de sucesso: ${report.summary.successRate}`);
  console.log(`Custo total: ${report.summary.totalCost}`);
  console.log(`Custo médio por execução: ${report.summary.avgCostPerRun}`);
  console.log(`Duração total: ${report.summary.totalDuration}`);
  console.log(`Duração média: ${report.summary.avgDuration}`);
  console.log(`Tokens totais: ${report.summary.totalTokens}`);
  console.log(`Intervenções médias: ${report.summary.avgInterventions}`);
  console.log(`Retries médios: ${report.summary.avgRetries}`);
}

main();
