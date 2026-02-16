import { calculatePartyOutputs } from './src/utils/calculation.js';

const mockUnit = {
    id: 999,
    name: "奥義検証ユニット",
    element: "光",
    baseAtk: 2000,
    actions: {
        arts: { multiplier: 5000, type: "魔法", element: "光", buffs: [] },
        trueArts: { multiplier: 10000, type: "魔法", element: "光", buffs: [] },
        superArts: { multiplier: 20000, type: "魔法", element: "光", buffs: [] }
    }
};

const enemyStats = { def: 0 };

const party = [
    {
        unit: mockUnit,
        equips: [
            {
                name: "全奥義バフ装備",
                buffs: [{ type: 'all_arts_dmg_up', value: 30, target: 'party' }]
            },
            {
                name: "真奥義専用バフ装備",
                buffs: [{ type: 'true_arts_dmg_up', value: 50, target: 'party' }]
            },
            {
                name: "装備ダメバフ装備",
                buffs: [{ type: 'equip_dmg_up', value: 40, target: 'party' }]
            },
            {
                name: "攻撃装備",
                multiplier: 5000,
                type: "物理",
                element: "無",
                buffs: []
            }
        ],
        selectedAction: 'trueArts'
    }
];

// Test 1: True Arts (Should get all_arts and true_arts buffs)
const resTA = calculatePartyOutputs(party, enemyStats);

// Test 2: Normal Arts (Should only get all_arts buff)
party[0].selectedAction = 'arts';
const resArts = calculatePartyOutputs(party, enemyStats);

console.log("--- Advanced Damage Buff Verification ---");

const logTA = resTA.logs.find(l => l.action === "真奥義");
const logEq = resTA.logs.find(l => l.action === "攻撃装備");
const logArts = resArts.logs.find(l => l.action === "奥義");

console.log(`True Arts Dmg: ${logTA.damage}`);
console.log(`Normal Arts Dmg: ${logArts.damage}`);
console.log(`Equip Dmg: ${logEq.damage}`);

/**
 * Expected Calculation Logic:
 * Base Calculation Factor: 2000 * 700 / (3500 + 2000) = 254.545...
 * baseDmgCrit (non-linear): atkFactor * 1.0 * multiplier
 * 
 * 1. True Arts:
 *    Multiplier: 100 (10000%)
 *    Total DMG UP: all_arts(30) + true_arts(50) = 80%
 *    Factor: 254.545 * 100 = 25454.5
 *    Crit (1.25): 25454.5 * 1.25 = 31818.1
 *    DMG UP (1.8): 31818.1 * 1.8 = 57272.58 -> 57273
 * 
 * 2. Normal Arts:
 *    Multiplier: 50 (5000%)
 *    Total DMG UP: all_arts(30) = 30%
 *    Factor: 254.545 * 50 = 12727.25
 *    Crit (1.25): 12727.25 * 1.25 = 15909.06
 *    DMG UP (1.3): 15909.06 * 1.3 = 20681.7 -> 20682
 * 
 * 3. Equip Damage:
 *    Multiplier: 50 (5000%)
 *    Total DMG UP: equip_dmg_up(40) = 40%
 *    Factor: 254.545 * 50 = 12727.25
 *    Crit (1.25): 12727.25 * 1.25 = 15909.06
 *    DMG UP (1.4): 15909.06 * 1.4 = 22272.6 -> 22273
 */

if (Math.abs(logTA.damage - 57273) < 10) console.log("True Arts Buff Test: PASS");
else console.error(`TA Buff FAIL: Got ${logTA.damage}, Expected 57273`);

if (Math.abs(logArts.damage - 20682) < 10) console.log("Normal Arts Buff Test: PASS");
else console.error(`Arts Buff FAIL: Got ${logArts.damage}, Expected 20682`);

if (Math.abs(logEq.damage - 22273) < 10) console.log("Equip Buff Test: PASS");
else console.error(`Equip Buff FAIL: Got ${logEq.damage}, Expected 22273`);
