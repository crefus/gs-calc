import { calculatePartyOutputs } from './src/utils/calculation.js';

const attacker = {
    id: 1101,
    name: "アタッカー",
    element: "光",
    race: "人族",
    baseAtk: 2000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "光", buffs: [] } }
};

const enemyStats = { def: 0 };

// Case 1: 100% Crit Rate, 0% Buffs -> Base Crit Damage
const party1 = [
    {
        unit: { ...attacker, abilities: [{ type: 'critical_up', value: 100, target: 'self' }] },
        equips: [],
        selectedAction: 'skill'
    }
];

const result1 = calculatePartyOutputs(party1, enemyStats);
const log1 = result1.logs.find(l => l.unitName === "アタッカー");

// Case 2: 100% Crit Rate, 100% Crit Dmg Up
const party2 = [
    {
        unit: {
            ...attacker,
            abilities: [
                { type: 'critical_up', value: 100, target: 'self' },
                { type: 'crit_dmg_up', value: 100, target: 'self' }
            ]
        },
        equips: [],
        selectedAction: 'skill'
    }
];

const result2 = calculatePartyOutputs(party2, enemyStats);
const log2 = result2.logs.find(l => l.unitName === "アタッカー");

console.log("--- Critical Damage Up Verification ---");

/**
 * Expected Calculation:
 * baseFactor (2000 atk): 254.545...
 * baseDmg (5000 multi): 12727.25
 * 
 * result1 (0% buff, 100% crit):
 * dmg = 12727.25 * 1.25 = 15909.06 -> 15910
 * 
 * result2 (100% crit_dmg_up, 100% crit):
 * critMultiplier is still 1.25, but dmgUp becomes 100% for the crit part.
 * dmgMultiplier = (1 + 100/100) = 2.0
 * dmg = (12727.25 * 2.0) * 1.25 = 25454.5 * 1.25 = 31818.125 -> 31819
 */

console.log(`Damage without Crit Dmg Up: ${log1.damage}`);
console.log(`Damage with 100% Crit Dmg Up: ${log2.damage}`);

if (Math.abs(log1.damage - 15910) < 10 && Math.abs(log2.damage - 31819) < 10) {
    console.log("Crit Dmg Up Check: PASS");
} else {
    console.error("Crit Dmg Up Check: FAIL");
    console.error(`Expected log2 around 31819, got ${log2.damage}`);
}

// Case 3: 0% Crit Rate, 100% Crit Dmg Up -> Should be same as no buff
const party3 = [
    {
        unit: {
            ...attacker,
            abilities: [
                { type: 'crit_dmg_up', value: 100, target: 'self' }
            ]
        },
        equips: [],
        selectedAction: 'skill'
    }
];
const result3 = calculatePartyOutputs(party3, enemyStats);
const log3 = result3.logs.find(l => l.unitName === "アタッカー");
console.log(`Damage with 0% Crit Rate and 100% Crit Dmg Up: ${log3.damage}`);
if (Math.abs(log3.damage - 12728) < 10) {
    console.log("Non-Crit Stability Check: PASS");
} else {
    console.error("Non-Crit Stability Check: FAIL");
}
