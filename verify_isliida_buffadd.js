import { calculatePartyOutputs } from './src/utils/calculation.js';

const isliida = {
    id: 15,
    name: "若きイスリーダ皇帝",
    element: "光",
    race: "人族",
    baseAtk: 3800,
    actions: {
        superArts: {
            multiplier: 160000,
            type: "魔法",
            element: "光",
            conditional: {
                buttonId: "90seconds",
                multiplierRate: 1.0,
                buffAdd: 50
            },
            buffs: [
                {
                    type: "elem_unit_dmg_up",
                    value: 150,
                    target: "party",
                    target_element: "光",
                    overlap: true
                }
            ]
        }
    },
    button: {
        id: "90seconds",
        name: "90秒以内",
        value: false
    }
};

const enemyStats = { def: 0 };

console.log("--- Buff Add Verification (Isliida) ---");

// Test 1: Button OFF
// Buff: 150%
// Multiplier: 160000%
const partyOff = [
    { unit: { ...isliida, button: { ...isliida.button, value: false } }, equips: [], selectedAction: 'superArts' }
];
const resultOff = calculatePartyOutputs(partyOff, enemyStats);
const logOff = resultOff.logs[0];
console.log(`Test 1 (Button OFF): Damage = ${logOff.damage}`);

// Test 2: Button ON
// Buff: 150 + 50 = 200%
// Multiplier: 160000%
const partyOn = [
    { unit: { ...isliida, button: { ...isliida.button, value: true } }, equips: [], selectedAction: 'superArts' }
];
const resultOn = calculatePartyOutputs(partyOn, enemyStats);
const logOn = resultOn.logs[0];
console.log(`Test 2 (Button ON): Damage = ${logOn.damage}`);

const ratio = logOn.damage / logOff.damage;
const expectedRatio = (1 + 2.0) / (1 + 1.5); // 3.0 / 2.5 = 1.2
console.log(`Damage Ratio: ${ratio} (Expected ${expectedRatio})`);

if (Math.abs(ratio - expectedRatio) < 0.01) {
    console.log("Verification: PASS");
} else {
    console.error("Verification: FAIL");
}
