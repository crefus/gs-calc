import { calculatePartyOutputs } from './src/utils/calculation.js';

const unitWithAdvancedBuffs = {
    id: 101,
    name: "Advanced Variable Unit",
    baseAtk: 2000,
    element: "水",
    race: "人族",
    abilities: [
        {
            type: "atk_up",
            value: "50 + 50", // Test addition: 100% up
            target: "self"
        },
        {
            type: "dmg_up",
            value: "self_atk * 0.01", // Test self_atk: 1% of final ATK (4000) = 40% dmg up
            target: "self"
        }
    ],
    actions: {
        trueArts: {
            multiplier: 10000,
            type: "物理",
            element: "水",
            buffs: []
        }
    }
};

const enemyStats = { def: 0 };

console.log("--- Advanced Variable Verification ---");

const party = [
    { unit: unitWithAdvancedBuffs, equips: [], selectedAction: 'trueArts', isLeader: false }
];

const result = calculatePartyOutputs(party, enemyStats);
const log = result.logs[0];

// Expected:
// Base ATK 2000 + 100% = 4000 Final ATK
// DMG UP = 4000 * 0.01 = 40%
// Damage = BaseAtk * Multi * (1 + DmgUp) = 4000 * 100 * (1.4) = 560000
// Note: our calculateHit returns raw value. 4000 * 100 * 1.4 = 560000

console.log(`Final ATK: ${log.stats.atk} (Expected 4000)`);
console.log(`Damage: ${log.damage} (Expected 560000)`);

if (Math.abs(log.stats.atk - 4000) < 1 && Math.abs(log.damage - 560000) < 1) {
    console.log("Verification: PASS");
} else {
    console.error("Verification: FAIL");
}
