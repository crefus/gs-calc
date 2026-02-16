import { calculatePartyOutputs } from './src/utils/calculation.js';

const unitWithLeaderBuff = {
    id: 100,
    name: "Leader Specific Unit",
    baseAtk: 3000,
    element: "光",
    race: "人族",
    abilities: [
        {
            type: "atk_up",
            value: "50 * is_leader",
            target: "self"
        }
    ],
    actions: {
        trueArts: {
            multiplier: 10000,
            type: "物理",
            element: "光",
            buffs: []
        }
    }
};

const enemyStats = { def: 0 };

console.log("--- is_leader Variable Verification ---");

// Test 1: Unit is Leader
const partyAsLeader = [
    { unit: unitWithLeaderBuff, equips: [], selectedAction: 'trueArts', isLeader: true }
];
const resultAsLeader = calculatePartyOutputs(partyAsLeader, enemyStats);
const logAsLeader = resultAsLeader.logs[0];
console.log(`Test 1 (As Leader): ATK = ${logAsLeader.stats.atk} (Expected 4500)`);

// Test 2: Unit is NOT Leader
const partyNotLeader = [
    { unit: unitWithLeaderBuff, equips: [], selectedAction: 'trueArts', isLeader: false }
];
const resultNotLeader = calculatePartyOutputs(partyNotLeader, enemyStats);
const logNotLeader = resultNotLeader.logs[0];
console.log(`Test 2 (Not Leader): ATK = ${logNotLeader.stats.atk} (Expected 3000)`);

if (Math.abs(logAsLeader.stats.atk - 4500) < 1 && Math.abs(logNotLeader.stats.atk - 3000) < 1) {
    console.log("Verification: PASS");
} else {
    console.error("Verification: FAIL");
}
