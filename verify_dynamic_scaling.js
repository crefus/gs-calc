import { calculatePartyOutputs } from './src/utils/calculation.js';

const unitBase = {
    id: 1,
    name: "Base Unit",
    baseAtk: 2000,
    race: "人族",
    element: "樹",
    actions: { arts: { multiplier: 0, buffs: [] } }
};

const attacker = {
    id: 2,
    name: "Attacker",
    race: "神族",
    element: "光",
    baseAtk: 2000,
    actions: {
        arts: { multiplier: 10000, type: "物理" }
    }
};

const enemyStats = { def: 0 };

console.log("--- Party Count Dynamic Scaling Verification ---");

// Test 1: Race count scaling
// party_race_count = 2 (Human, God)
// Buff value: "30 * party_race_count" -> 60
const party1 = [
    {
        unit: { ...unitBase, abilities: [{ type: "atk_up", value: "30 * party_race_count", target: "party" }] },
        equips: [],
        selectedAction: 'arts'
    },
    {
        unit: attacker,
        equips: [],
        selectedAction: 'arts'
    }
];

const result1 = calculatePartyOutputs(party1, enemyStats);
const log1 = result1.logs.find(l => l.unitName === "Attacker");

// 60% Up: 2000 * 1.6 = 3200
// atkFactor = 3200 * 700 / (3500 + 3200) = 334.33
// Damage: 334.33 * 100 = 33433
console.log(`Test 1 (Race count scaling): Attacker Damage = ${log1.damage} (Expected 33433)`);
if (Math.abs(log1.damage - 33433) < 10) console.log("Test 1: PASS");
else console.error("Test 1: FAIL");

// Test 2: Element count scaling
// party_element_count = 2 (樹, 光)
// Buff value: "20 * party_element_count" -> 40
const party2 = [
    {
        unit: { ...unitBase, abilities: [{ type: "atk_up", value: "20 * party_element_count", target: "party" }] },
        equips: [],
        selectedAction: 'arts'
    },
    {
        unit: attacker,
        equips: [],
        selectedAction: 'arts'
    }
];

const result2 = calculatePartyOutputs(party2, enemyStats);
const log2 = result2.logs.find(l => l.unitName === "Attacker");

// 40% Up: 2000 * 1.4 = 2800
// atkFactor = 2800 * 700 / (3500 + 2800) = 311.11
// Damage: 311.11 * 100 = 31111
console.log(`Test 2 (Element count scaling): Attacker Damage = ${log2.damage} (Expected 31112)`);
if (Math.abs(log2.damage - 31112) < 10) console.log("Test 2: PASS");
else console.error("Test 2: FAIL");

// Test 3: Multiple units of same race
// party_race_count = 1 (Human, Human)
// Buff: "50 * party_race_count" -> 50
const party3 = [
    {
        unit: { ...unitBase, abilities: [{ type: "atk_up", value: "50 * party_race_count", target: "party" }] },
        equips: [],
        selectedAction: 'arts'
    },
    {
        unit: { ...attacker, name: "Attacker2", race: "人族" },
        equips: [],
        selectedAction: 'arts'
    }
];
const result3 = calculatePartyOutputs(party3, enemyStats);
const log3 = result3.logs.find(l => l.unitName === "Attacker2");

// 50% Up: 2000 * 1.5 = 3000 -> AtkFactor = 323.08
// Damage: 323.08 * 100 = 32308
console.log(`Test 3 (Same race): Attacker Damage = ${log3.damage} (Expected 32308)`);
if (Math.abs(log3.damage - 32308) < 10) console.log("Test 3: PASS");
else console.error("Test 3: FAIL");
