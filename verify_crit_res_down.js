import { calculatePartyOutputs } from './src/utils/calculation.js';

const attacker = {
    id: 994,
    name: "攻撃者",
    element: "光",
    race: "人族",
    baseAtk: 2000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "光", buffs: [] } }
};

const subUnit = {
    id: 995,
    name: "デバッファー",
    element: "光",
    race: "人族",
    baseAtk: 1000,
    actions: { skill: { multiplier: 0, type: "物理", element: "光", buffs: [] } }
};

const enemyStats = { def: 0 };

// Case 1: Attacker has 0% Crit Rate, Enemy has 100% Crit Res Down
const party1 = [
    {
        unit: attacker,
        equips: [],
        selectedAction: 'skill'
    },
    {
        unit: subUnit,
        equips: [
            {
                name: "クリ耐性ダウン装備",
                buffs: [{ type: 'crit_res_down', value: 100, target: 'enemy' }]
            }
        ],
        selectedAction: 'skill',
        equipEnabled: [true, true, true]
    }
];

const result1 = calculatePartyOutputs(party1, enemyStats);

console.log("--- Critical Resistance Down Verification ---");

const logA1 = result1.logs.find(l => l.unitName === "攻撃者");

/**
 * Expected Calculation (Crit):
 * Base Factor (atk 2000): 254.545...
 * baseDmgCrit (multi 5000): 12727.25
 * Crit Multi: 1.25
 * Expected Damage: 12727.25 * 1.25 = 15909.06 -> 15910
 * 
 * If no crit (0%): 12727.25 * 1.0 = 12727
 */

console.log(`Damage with 100% Crit Res Down: ${logA1.damage}`);

if (Math.abs(logA1.damage - 15910) < 10) {
    console.log("Crit Res Down Check: PASS (Critical achievement confirmed)");
} else if (Math.abs(logA1.damage - 12727) < 10) {
    console.error("Crit Res Down Check: FAIL (Damage is non-critical)");
} else {
    console.error(`Crit Res Down Check: FAIL (Got ${logA1.damage}, Expected 15910)`);
}

// Case 2: Attacker has 50% Crit Rate, Enemy has 50% Crit Res Down -> Should be 100%
attacker.abilities = [{ type: 'critical_up', value: 50, target: 'self' }];
const result2 = calculatePartyOutputs(party1, enemyStats);
const logA2 = result2.logs.find(l => l.unitName === "攻撃者");
console.log(`Damage with 50% Buff + 50% Debuff: ${logA2.damage}`);
if (Math.abs(logA2.damage - 15910) < 10) console.log("Synergy Check: PASS");
else console.error("Synergy Check: FAIL");
