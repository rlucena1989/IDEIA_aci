#!/usr/bin/env node

/**
 * Calculadora de custo para benchmark
 * Uso: node cost_calculator.mjs <inputTokens> <outputTokens> <model>
 */

const prices = {
  'gpt-4o': { input: 2.50, output: 10.00 }, // por 1M tokens
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku': { input: 0.80, output: 4.00 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 }
};

function calculateCost(inputTokens, outputTokens, model) {
  if (!prices[model]) {
    console.error(`❌ Modelo não encontrado: ${model}`);
    console.error(`Modelos disponíveis: ${Object.keys(prices).join(', ')}`);
    process.exit(1);
  }
  
  const price = prices[model];
  const inputCost = (inputTokens / 1_000_000) * price.input;
  const outputCost = (outputTokens / 1_000_000) * price.output;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: totalCost.toFixed(4),
    model: model,
    inputTokens: inputTokens,
    outputTokens: outputTokens
  };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Uso: node cost_calculator.mjs <inputTokens> <outputTokens> <model>');
    console.log('');
    console.log('Modelos disponíveis:');
    for (const [model, price] of Object.entries(prices)) {
      console.log(`  ${model}: $${price.input}/1M input, $${price.output}/1M output`);
    }
    console.log('');
    console.log('Exemplo: node cost_calculator.mjs 1000 500 gpt-4o');
    console.log('Exemplo: node cost_calculator.mjs 5000 2000 claude-3-5-sonnet');
    process.exit(1);
  }
  
  const inputTokens = parseInt(args[0]);
  const outputTokens = parseInt(args[1]);
  const model = args[2];
  
  if (isNaN(inputTokens) || isNaN(outputTokens)) {
    console.error('❌ Tokens devem ser números inteiros');
    process.exit(1);
  }
  
  const result = calculateCost(inputTokens, outputTokens, model);
  
  console.log('💰 Custo calculado:');
  console.log(`Modelo: ${result.model}`);
  console.log(`Input tokens: ${result.inputTokens}`);
  console.log(`Output tokens: ${result.outputTokens}`);
  console.log(`Custo input: $${result.inputCost}`);
  console.log(`Custo output: $${result.outputCost}`);
  console.log(`Custo total: $${result.totalCost}`);
}

main();
