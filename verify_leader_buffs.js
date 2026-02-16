import { calculatePartyOutputs } from './src/utils/calculation.js';

const leaderUnit = {
    id: 991,
    name: "リーダー",
    element: "光",
    race: "人族",
    baseAtk: 2000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "光", buffs: [] } }
};

const subUnit = {
    id: 992,
    name: "サブ",
    element: "闇",
    race: "魔族",
    baseAtk: 2000,
    actions: { skill: { multiplier: 5000, type: "物理", element: "闇", buffs: [] } }
};

const enemyStats = { def: 0 };

// Case 1: Slot 1 is Leader
const party1 = [
    {
        unit: leaderUnit,
        isLeader: true,
        equips: [],
        selectedAction: 'skill'
    },
    {
        unit: subUnit,
        isLeader: false,
        equips: [
            {
                name: "リーダーバフ装備",
                buffs: [{ type: 'dmg_up', value: 50, target: 'leader' }]
            }
        ],
        selectedAction: 'skill',
        equipEnabled: [true, true, true]
    }
];

const result1 = calculatePartyOutputs(party1, enemyStats);

console.log("--- Leader-Specific Buff Verification ---");

const logL1 = result1.logs.find(l => l.unitName === "リーダー");
const logS1 = result1.logs.find(l => l.unitName === "サブ");

console.log(`Leader Damage (with 50% buff): ${logL1.damage}`);
console.log(`Sub Damage (no buff): ${logS1.damage}`);

/**
 * Expected Calculation Logic (Crit):
 * Base Factor: 254.545...
 * baseDmgCrit: 12727.25
 * Crit (1.25): 15909.06
 * 
 * 1. Leader (Targeted): 15909.06 * 1.5 = 23863.59 -> 23864
 * 2. Sub (Not targeted): 15909.06 * 1.0 = 15909.06 -> 15910
 */

if (Math.abs(logL1.damage - 23864) < 10) console.log("Leader Buff Check: PASS");
else console.error(`Leader FAIL: Got ${logL1.damage}, Expected 23864`);

if (Math.abs(logS1.damage - 15910) < 10) console.log("Sub Buff Check: PASS");
else console.error(`Sub FAIL: Got ${logS1.damage}, Expected 15910`);
