import { calculatePartyOutputs } from './src/utils/calculation.js';

const unitBase = {
    id: 1,
    name: "Standard Human",
    baseAtk: 2000,
    race: "人族",
    element: "樹",
    actions: { arts: { multiplier: 0, buffs: [] } }
};

const attackerGod = {
    id: 2,
    name: "God Attacker",
    race: "神族",
    element: "光",
    baseAtk: 2000,
    actions: {
        arts: { multiplier: 10000, type: "物理" }
    }
};

const enemyStats = { def: 0 };

console.log("--- Specific Party Count Scaling Verification ---");

// Test 1: Specific race count scaling
// Party: 2 Humans, 1 God
// Human count: 2
// Buff value on unit0: "50 * party_人族_count" -> 100% atk up
const party1 = [
    {
        unit: { ...unitBase, name: "Human 1 Buffer", abilities: [{ type: "atk_up", value: "50 * party_人族_count", target: "party" }] },
        equips: [],
        selectedAction: 'arts'
    },
    {
        unit: { ...unitBase, name: "Human 2" },
        equips: [],
        selectedAction: 'arts'
    },
    {
        unit: { ...attackerGod, name: "God Target" },
        equips: [],
        selectedAction: 'arts'
    }
];

const result1 = calculatePartyOutputs(party1, enemyStats);
const log1 = result1.logs.find(l => l.unitName === "God Target");

// 100% Up: 2000 * 2.0 = 4000
// AtkFactor: 4000 * 700 / (3500 + 4000) = 373.33
// Damage: 373.33 * 100 = 37333
console.log(`Test 1 (Specific race count scaling): God Target Damage = ${log1.damage} (Expected 37333)`);
if (Math.abs(log1.damage - 37333) < 10) console.log("Test 1: PASS");
else console.error("Test 1: FAIL");

// Test 2: Specific element count scaling
// Party: 1 Tree (Human1), 1 Light (God)
// Tree count: 1
// Buff: "100 * party_樹_count" -> 100% atk up
const party2 = [
    {
        unit: { ...unitBase, name: "Human Tree Buffer", abilities: [{ type: "atk_up", value: "100 * party_樹_count", target: "party" }] },
        equips: [],
        selectedAction: 'arts'
    },
    {
        unit: attackerGod,
        equips: [],
        selectedAction: 'arts'
    }
];

const result2 = calculatePartyOutputs(party2, enemyStats);
const log2 = result2.logs.find(l => l.unitName === "God Attacker");

// 100% Up: 2000 * 2.0 = 4000 -> Expected 37333
console.log(`Test 2 (Specific element count scaling): God Attacker Damage = ${log2.damage} (Expected 37333)`);
if (Math.abs(log2.damage - 37333) < 10) console.log("Test 2: PASS");
else console.error("Test 2: FAIL");
