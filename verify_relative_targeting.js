import { calculatePartyOutputs } from './src/utils/calculation.js';

const unitBase = {
    id: 1,
    name: "Standard Unit",
    baseAtk: 2000,
    actions: {
        arts: { multiplier: 0, buffs: [] }
    }
};

const attacker = {
    id: 2,
    name: "Attacker",
    baseAtk: 2000,
    actions: {
        arts: { multiplier: 10000, type: "物理" }
    }
};

const enemyStats = { def: 0 };

console.log("--- Relative Position Targeting Verification ---");

// Test 1: Unit at index 0 gives 'right' buff to index 1
// Unit0 (buff right: 50% atk)
// Unit1 (Attacker)
const party1 = [
    {
        unit: { ...unitBase, name: "Buffer", actions: { arts: { buffs: [{ type: "atk_up", value: 50, target: "right" }] } } },
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
const log1_0 = result1.logs.find(l => l.unitName === "Buffer");
const log1_1 = result1.logs.find(l => l.unitName === "Attacker");

// Attacker (Unit1) should have 50% atk up.
// Base 2000 atk -> atkFactor 254.54
// 50% Up -> 3000 atk -> atkFactor 323.08
// Damage = 323.08 * 100 = 32308
console.log(`Test 1 (Unit0 -> Right -> Unit1): Attacker Damage = ${log1_1.damage} (Expected 32308)`);
if (Math.abs(log1_1.damage - 32308) < 10) console.log("Test 1: PASS");
else console.error("Test 1: FAIL");

// Test 2: Unit at index 1 gives 'left' buff to index 0
const party2 = [
    { unit: attacker, equips: [], selectedAction: 'arts' },
    { unit: { ...unitBase, name: "Buffer", actions: { arts: { buffs: [{ type: "atk_up", value: 50, target: "left" }] } } }, equips: [], selectedAction: 'arts' }
];
const result2 = calculatePartyOutputs(party2, enemyStats);
const log2_0 = result2.logs.find(l => l.unitName === "Attacker");
console.log(`Test 2 (Unit1 -> Left -> Unit0): Attacker Damage = ${log2_0.damage} (Expected 32308)`);
if (Math.abs(log2_0.damage - 32308) < 10) console.log("Test 2: PASS");
else console.error("Test 2: FAIL");

// Test 3: Unit at index 1 gives 'both_sides' buff to index 0 and 2
const party3 = [
    { unit: { ...attacker, name: "Attacker Left" }, equips: [], selectedAction: 'arts' },
    { unit: { ...unitBase, name: "Buffer Center", actions: { arts: { buffs: [{ type: "atk_up", value: 50, target: "both_sides" }] } } }, equips: [], selectedAction: 'arts' },
    { unit: { ...attacker, name: "Attacker Right" }, equips: [], selectedAction: 'arts' }
];
const result3 = calculatePartyOutputs(party3, enemyStats);
const log3_L = result3.logs.find(l => l.unitName === "Attacker Left");
const log3_R = result3.logs.find(l => l.unitName === "Attacker Right");
console.log(`Test 3 (Unit1 -> Both Sides -> Unit0 & Unit2): Left Dmg = ${log3_L.damage}, Right Dmg = ${log3_R.damage} (Expected 32308)`);
if (Math.abs(log3_L.damage - 32308) < 10 && Math.abs(log3_R.damage - 32308) < 10) console.log("Test 3: PASS");
else console.error("Test 3: FAIL");

// Test 4: Unit at index 0 gives 'left' buff (should affect nobody)
const party4 = [
    { unit: { ...unitBase, actions: { arts: { buffs: [{ type: "atk_up", value: 50, target: "left" }] } } }, equips: [], selectedAction: 'arts' },
    { unit: attacker, equips: [], selectedAction: 'arts' }
];
const result4 = calculatePartyOutputs(party4, enemyStats);
const log4_1 = result4.logs.find(l => l.unitName === "Attacker");
console.log(`Test 4 (Unit0 -> Left -> Nobody): Attacker Damage = ${log4_1.damage} (Expected around 25455)`);
if (Math.abs(log4_1.damage - 25455) < 100) console.log("Test 4: PASS");
else console.error("Test 4: FAIL");
