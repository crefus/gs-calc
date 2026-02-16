import { calculatePartyOutputs } from './src/utils/calculation.js';

const humanUnit = {
    id: 991,
    name: "人族ユニット",
    element: "光",
    race: "人族",
    baseAtk: 2000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "光", buffs: [] } }
};

const demonUnit = {
    id: 992,
    name: "魔族ユニット",
    element: "闇",
    race: "魔族",
    baseAtk: 2000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "闇", buffs: [] } }
};

const enemyStats = { def: 0 };

const party = [
    {
        unit: humanUnit,
        equips: [
            {
                name: "人族バフ装備",
                buffs: [{ type: 'race_dmg_up', value: 50, target: 'party', target_race: '人族' }]
            }
        ],
        selectedAction: 'skill'
    },
    {
        unit: demonUnit,
        equips: [],
        selectedAction: 'skill'
    }
];

const result = calculatePartyOutputs(party, enemyStats);

console.log("--- Race-Specific Buff Verification ---");

const logHuman = result.logs.find(l => l.unitName === "人族ユニット");
const logDemon = result.logs.find(l => l.unitName === "魔族ユニット");

console.log(`Human Unit Damage: ${logHuman.damage}`);
console.log(`Demon Unit Damage: ${logDemon.damage}`);

/**
 * Expected Calculation Logic:
 * Base Factor: 2000 * 700 / (3500 + 2000) = 254.545...
 * baseDmgCrit: 254.545 * 50 = 12727.25
 * Crit (1.25): 12727.25 * 1.25 = 15909.06
 * 
 * 1. Human Unit (Target of race_dmg_up +50%):
 *    Damage = 15909.06 * 1.5 = 23863.59 -> 23864
 * 
 * 2. Demon Unit (Not targeted):
 *    Damage = 15909.06 * 1.0 = 15909.06 -> 15910
 */

if (Math.abs(logHuman.damage - 23864) < 10) console.log("Human Unit Buff (Targeted): PASS");
else console.error(`Human Buff FAIL: Got ${logHuman.damage}, Expected 23864`);

if (Math.abs(logDemon.damage - 15910) < 10) console.log("Demon Unit Buff (Not Targeted): PASS");
else console.error(`Demon Buff FAIL: Got ${logDemon.damage}, Expected 15910`);
