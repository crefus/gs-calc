import { calculatePartyOutputs } from './src/utils/calculation.js';

const unitWithPB = {
    id: 1,
    name: "PB Specialist",
    baseAtk: 2000,
    race: "人族",
    element: "炎",
    actions: {
        phantomBullet: { multiplier: 50000, type: "物理", element: "炎" }
    }
};

const buffer = {
    id: 2,
    name: "Buffer",
    abilities: [
        { type: "all_arts_dmg_up", value: 100, target: "party" },
        { type: "pb_dmg_up", value: 50, target: "party" }
    ]
};

const enemyStats = { def: 0 };

console.log("--- Phantom Bullet (PB) Verification ---");

// Test 1: PB Damage calculation with multi-buffs
// Action: PB (50000%)
// Buffs: all_arts_dmg_up (100) + pb_dmg_up (50) = 150% total dmg up
const party1 = [
    { unit: unitWithPB, equips: [], selectedAction: 'phantomBullet' },
    { unit: buffer, equips: [], selectedAction: 'arts' }
];

const result1 = calculatePartyOutputs(party1, enemyStats);
const log1 = result1.logs.find(l => l.unitName === "PB Specialist");

// AtkFactor for 2000: 254.54
// Damage: 254.54 * 500 * (1 + 1.5) = 254.54 * 500 * 2.5 = 318175
console.log(`Test 1 (PB Damage): PB Damage = ${log1.damage} (Expected around 318181)`);
console.log(`Action name in log: ${log1.action}`);

if (Math.abs(log1.damage - 318181) < 10 && log1.action === "PB") {
    console.log("Test 1: PASS");
} else {
    console.error("Test 1: FAIL");
}

// Test 2: PB only buffs should not affect skill
const party2 = [
    { unit: { ...unitWithPB, actions: { ...unitWithPB.actions, skill: { multiplier: 2000, type: "物理" } } }, equips: [], selectedAction: 'skill' },
    { unit: buffer, equips: [], selectedAction: 'arts' }
];

const result2 = calculatePartyOutputs(party2, enemyStats);
const log2 = result2.logs.find(l => l.unitName === "PB Specialist");

// Buffs should NOT apply to skill. 
// AtkFactor: 254.54
// Damage: 254.54 * 20 = 5090.8 -> 5091
console.log(`Test 2 (Skill unaffected): Skill Damage = ${log2.damage} (Expected around 5091)`);
if (Math.abs(log2.damage - 5091) < 10) {
    console.log("Test 2: PASS");
} else {
    console.error("Test 2: FAIL");
}
