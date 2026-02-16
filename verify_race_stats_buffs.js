import { calculatePartyOutputs } from './src/utils/calculation.js';

const humanUnit = {
    id: 1001,
    name: "人族ユニット",
    element: "光",
    race: "人族",
    baseAtk: 2000,
    baseDef: 1000,
    baseHp: 5000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "光", buffs: [] } }
};

const demonUnit = {
    id: 1002,
    name: "魔族ユニット",
    element: "闇",
    race: "魔族",
    baseAtk: 2000,
    baseDef: 1000,
    baseHp: 5000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "闇", buffs: [] } }
};

const enemyStats = { def: 0 };

// Case 1: Race-Specific ATK and Stats Up
const party1 = [
    {
        unit: humanUnit,
        equips: [],
        selectedAction: 'skill'
    },
    {
        unit: demonUnit,
        equips: [
            {
                name: "人族バフ装備",
                buffs: [
                    { type: 'race_atk_up', value: 50, target: 'party', target_race: '人族' },
                    { type: 'race_stats_up', value: 20, target: 'party', target_race: '人族' }
                ]
            }
        ],
        selectedAction: 'skill',
        equipEnabled: [true, true, true]
    }
];

const result1 = calculatePartyOutputs(party1, enemyStats);

console.log("--- Race-Specific Stat Buff Verification ---");

const logH1 = result1.logs.find(l => l.unitName === "人族ユニット");
const logD1 = result1.logs.find(l => l.unitName === "魔族ユニット");

console.log(`Human Unit Stats: ATK:${logH1.stats.atk}, DEF:${logH1.stats.def}, HP:${logH1.stats.hp}`);
console.log(`Demon Unit Stats: ATK:${logD1.stats.atk}, DEF:${logD1.stats.def}, HP:${logD1.stats.hp}`);

/**
 * Expected Calculation for Human:
 * ATK: 2000 * (1 + (50+20)/100) = 2000 * 1.7 = 3400
 * DEF: 1000 * (1 + 20/100) = 1000 * 1.2 = 1200
 * HP: 5000 * (1 + 20/100) = 5000 * 1.2 = 6000
 * 
 * Expected Calculation for Demon:
 * No buffs should apply.
 * ATK: 2000, DEF: 1000, HP: 5000
 */

if (logH1.stats.atk === 3400 && logH1.stats.def === 1200 && logH1.stats.hp === 6000) {
    console.log("Human Stat Buff Check: PASS");
} else {
    console.error(`Human Stat Buff Check: FAIL (Got ATK:${logH1.stats.atk}, DEF:${logH1.stats.def}, HP:${logH1.stats.hp})`);
}

if (logD1.stats.atk === 2000 && logD1.stats.def === 1000 && logD1.stats.hp === 5000) {
    console.log("Demon Stat Buff Check: PASS");
} else {
    console.error(`Demon Stat Buff Check: FAIL (Got ATK:${logD1.stats.atk}, DEF:${logD1.stats.def}, HP:${logD1.stats.hp})`);
}
