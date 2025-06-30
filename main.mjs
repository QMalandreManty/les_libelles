import { readFile } from 'fs/promises';

const masterRaw = await readFile('./master_sorted.json', 'utf-8');
const branchRaw = await readFile('./branch_sorted.json', 'utf-8');

const master = JSON.parse(masterRaw);
const branch = JSON.parse(branchRaw);

const calculateSums = (data) => {
  let totalSum = 0;
  const perUserSum = {};

  data.forEach((item) => {
    const sum = Object.entries(item)
      .filter(([key]) => key.startsWith("simulated_amount.."))
      .reduce((acc, [_, value]) => acc + value, 0);

    totalSum += sum;

    const id = item.agent_software_id || "unknown";
    perUserSum[id] = (perUserSum[id] || 0) + sum;
  });

  return { totalSum, perUserSum };
};


const { totalSum: masterTotal, perUserSum: masterPerUser } = calculateSums(master);
const { totalSum: branchTotal, perUserSum: branchPerUser } = calculateSums(branch);

console.log('Master Total Sum:', masterTotal);
console.log('Branch Total Sum:', branchTotal);
console.log('\n📊 Différences totales :');
const totalDelta = branchTotal - masterTotal;
console.log(`Total master = ${masterTotal.toFixed(2)}, Total branch = ${branchTotal.toFixed(2)}, Delta = ${totalDelta.toFixed(2)}`);

console.log('\n\n🔍 Différences par agent :');

const allAgentIds = new Set([
  ...Object.keys(masterPerUser),
  ...Object.keys(branchPerUser),
]);

for (const agentId of allAgentIds) {
  const masterValue = masterPerUser[agentId] || 0;
  const branchValue = branchPerUser[agentId] || 0;

  if (masterValue !== branchValue) {
    const delta = branchValue - masterValue;
    console.log("".padEnd(50, '-'));
    console.log(`🧑 ${agentId} : master = ${masterValue.toFixed(2)}, branch = ${branchValue.toFixed(2)}, delta = ${delta.toFixed(2)}`);
    console.log("".padEnd(50, '-'));
  }
}

console.log(''.padEnd(50, '='));
console.log(''.padEnd(50, '='));
console.log(''.padEnd(50, '='));

// Regroupe par agent et par année
const groupByAgentAndYear = (data) => {
  const result = {};
  data.forEach((item) => {
    const id = item.agent_software_id || "unknown";
    if (!result[id]) result[id] = {};

    Object.entries(item).forEach(([key, value]) => {
      if (key.startsWith("simulated_amount..")) {
        const year = key.split("..")[1].split("-")[0];
        if (!result[id][year]) result[id][year] = 0;
        result[id][year] += value;
      }
    });
  });
  return result;
};

// Regroupe par année tous agents confondus
const totalByYear = (data) => {
  const result = {};
  data.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key.startsWith("simulated_amount..")) {
        const year = key.split("..")[1].split("-")[0];
        if (!result[year]) result[year] = 0;
        result[year] += value;
      }
    });
  });
  return result;
};

const masterPerUserPerYear = groupByAgentAndYear(master);
const branchPerUserPerYear = groupByAgentAndYear(branch);

const masterYearTotals = totalByYear(master);
const branchYearTotals = totalByYear(branch);

// Différences par agent et année
console.log("🔍 Différences par agent et par année :");

const allAgentIdsPerYear = new Set([
  ...Object.keys(masterPerUserPerYear),
  ...Object.keys(branchPerUserPerYear),
]);

for (const agentId of allAgentIdsPerYear) {
  const masterYears = masterPerUserPerYear[agentId] || {};
  const branchYears = branchPerUserPerYear[agentId] || {};
  const allYears = new Set([...Object.keys(masterYears), ...Object.keys(branchYears)]);

  for (const year of allYears) {
    const mVal = masterYears[year] || 0;
    const bVal = branchYears[year] || 0;
    if (mVal !== bVal) {
      const delta = bVal - mVal;
      console.log(`🧑 ${agentId} (${year}) : master = ${mVal.toFixed(2)}, branch = ${bVal.toFixed(2)}, delta = ${delta.toFixed(2)}`);
    }
  }
}

console.log("\n📊 Différences globales par année :");

const allYears = new Set([
  ...Object.keys(masterYearTotals),
  ...Object.keys(branchYearTotals),
]);

for (const year of allYears) {
  const masterVal = masterYearTotals[year] || 0;
  const branchVal = branchYearTotals[year] || 0;

  if (masterVal !== branchVal) {
    const delta = branchVal - masterVal;
    console.log(`📅 ${year} : master = ${masterVal.toFixed(2)}, branch = ${branchVal.toFixed(2)}, delta = ${delta.toFixed(2)}`);
  }
}
