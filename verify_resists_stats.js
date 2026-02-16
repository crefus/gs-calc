import { calculatePartyOutputs } from './src/utils/calculation.js';

const mockUnit = {
    id: 999,
    name: "検証ユニット",
    element: "火",
    baseAtk: 2000,
    baseDef: 1000,
    baseHp: 5000,
    actions: {
        trueArts: {
            multiplier: 10000,
            type: "物理",
            element: "火",
            buffs: [
                { type: 'atk_up_flat', value: 500, target: 'self' },
                { type: 'atk_up', value: 50, target: 'self' },
                { type: 'phys_res_down', value: 20, target: 'enemy' }
            ]
        }
    }
};

const enemyStats = {
    def: 0,
    resists: {
        physical: 50, // 50% resistance
        elements: { "火": 10 } // 10% fire resistance
    }
};

const party = [
    {
        unit: mockUnit,
        equips: [
            {
                name: "被ダメアップ装備",
                buffs: [{ type: 'dmg_taken_up', value: 20, target: 'enemy' }]
            }
        ],
        selectedAction: 'trueArts'
    }
];

const result = calculatePartyOutputs(party, enemyStats);

console.log("--- Resistance & Stats Verification ---");

const log = result.logs[0];
console.log(`Unit: ${log.unitName}`);
console.log(`Final ATK: ${log.stats.atk}`);
console.log(`Final Damage: ${log.damage}`);

/**
 * Expected Calculation:
 * 
 * 1. Stats:
 *    Base ATK: 2000
 *    Buffs: ATK Flat +500, ATK % +50
 *    Final ATK = (2000 + 500) * 1.5 = 3750
 * 
 * 2. Resistance:
 *    Enemy Base: Physical 50%, Fire 10% (Total 60%)
 *    Debuffs:
 *      phys_res_down: 20%
 *      dmg_taken_up: 20% (treat as flat resistance reduction)
 *    Effective Resist = (50 - 20) + 10 - 20 = 10 + 10 = 20%
 *    DMG Multiplier = (1 - 20/100) = 0.8
 * 
 * 3. Damage (Before Resists):
 *    Base = 3750 * 100 = 375,000
 *    Crit = 375,000 * 1.25 = 468,750
 * 
 * 4. Final Damage (With Resists):
 *    Damage = 468,750 * 0.8 = 375,000
 * 
 * Note: Due to non-linear atkFactor calculation in calculation.js:
 * atkFactor = 3750 * 700 / (3500 + 3750) = 2625000 / 7250 = 362.068...
 * baseDmgCrit = 362.068 * 1 * 100 = 36206.8...
 * Final = 36206.8 * 1.25 * 0.8 = 36206.8
 */

if (Math.abs(log.stats.atk - 3750) < 1) {
    console.log("ATK Calculation: PASS");
} else {
    console.error(`ATK Calculation: FAIL. Got ${log.stats.atk}, Expected 3750`);
}

if (Math.abs(log.damage - 18104) < 10) {
    console.log("Damage w/ Resists Calculation: PASS");
} else {
    console.error(`Damage w/ Resists Calculation: FAIL. Got ${log.damage}, Expected 18104`);
}
