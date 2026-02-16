import { calculateHit, calculatePartyOutputs } from './src/utils/calculation.js';

// Mock Data matching structure
const mockUnit = {
    id: 1, name: "Test Unit", baseAtk: 2000,
    multipliers: { trueArts: 10000 } // 10000%
};
const mockEquip = {
    id: 101, name: "Test Equip", multiplier: 5000,
    buffs: [{ type: 'dmg_up', value: 50, target: 'party' }]
};

console.log("--- Starting Verification ---");

// Test 1: Single Hit Manual Formula
// 2000 ATK, 10000% Multi -> (2000 * 100) = 200,000 Raw
// Enemy DEF 0.
// DMG UP 0.
const dmg1 = calculateHit({
    unitAtk: 2000,
    skillMulti: 10000,
    enemyDef: 0,
    defIgnore: 0,
    totalDmgUp: 0,
    enemyDmgTaken: 0,
    isCrit: false,
    critDmgUp: 0,
    elemAdvantage: 1.0,
    isBreak: false
});
console.log(`Test 1 (Basic 200k): ${dmg1}`);
if (Math.abs(dmg1 - 200000) < 100) console.log("PID 1 PASS"); else console.error("PID 1 FAIL");

// Test 2: Party Buff Aggregate
// Unit with Party DMG UP 50%
const party = [
    {
        unit: mockUnit,
        equips: [mockEquip, null, null],
        crest: null
    },
    { unit: null, equips: [], crest: null },
    { unit: null, equips: [], crest: null },
    { unit: null, equips: [], crest: null }
];

const output = calculatePartyOutputs(party, { def: 0 });
console.log(`Test 2 (Party Output): Total ${output.totalDamage}`);
// Logic:
// Party DMG UP = 50%
// Unit Self Stats: ATK 2000 (no up), DMG UP 50% (from party).
// TA Dmg: 2000 * 10000% = 200,000.
// Apply DMG UP 50% -> 300,000.
// Apply Crit (1.25) -> 375,000. (Auto logic forces crit: true)
// Equip Dmg: 2000 * 5000% = 100,000.
// Apply DMG UP 50% -> 150,000.
// Apply Crit -> 187,500.
// Total expected: 375,000 + 187,500 = 562,500.

const expected = 562500;
if (Math.abs(output.totalDamage - expected) < 1000) {
    console.log("PID 2 PASS");
} else {
    console.error(`PID 2 FAIL. Got ${output.totalDamage}, Expected ${expected}`);
    // Debug log
    console.log(output.logs);
}
