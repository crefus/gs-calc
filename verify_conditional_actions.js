import { calculatePartyOutputs } from './src/utils/calculation.js';

const etica = {
    id: 14,
    name: "エチカ",
    baseAtk: 3496,
    race: "精霊族",
    element: "光",
    actions: {
        trueArts: {
            multiplier: 70000,
            type: "物理",
            element: "光",
            conditional: {
                buttonId: "lord_of_feather",
                multiplierRate: 2.0,
                buffRate: 2.0
            },
            buffs: [
                {
                    type: "phys_dmg_up",
                    value: 220,
                    target: "party"
                }
            ]
        }
    },
    button: {
        id: "lord_of_feather",
        name: "ロードオブフェザー",
        value: false
    }
};

const enemyStats = { def: 0 };

console.log("--- Conditional Action (Button System) Verification ---");

// Test 1: Button OFF
const partyOff = [
    { unit: { ...etica, button: { ...etica.button, value: false } }, equips: [], selectedAction: 'trueArts' }
];
const resultOff = calculatePartyOutputs(partyOff, enemyStats);
const logOff = resultOff.logs[0];
console.log(`Test 1 (Button OFF): Damage = ${logOff.damage} (Expected 783552)`);

// Test 2: Button ON
const partyOn = [
    { unit: { ...etica, button: { ...etica.button, value: true } }, equips: [], selectedAction: 'trueArts' }
];
const resultOn = calculatePartyOutputs(partyOn, enemyStats);
const logOn = resultOn.logs[0];
console.log(`Test 2 (Button ON): Damage = ${logOn.damage} (Expected 2644488)`);

if (Math.abs(logOff.damage - 783552) < 100 && Math.abs(logOn.damage - 2644488) < 100) {
    console.log("Verification: PASS");
} else {
    console.error("Verification: FAIL");
}
