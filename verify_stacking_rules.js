import { calculatePartyOutputs } from './src/utils/calculation.js';

const attacker = {
    id: 1,
    name: "Attacker",
    baseAtk: 2000,
    actions: {
        arts: { multiplier: 10000, type: "物理", buffs: [{ type: "atk_up", value: 50, target: "party" }] },
        trueArts: { multiplier: 20000, type: "物理", buffs: [{ type: "atk_up", value: 100, target: "party" }] }
    }
};

const support = {
    id: 2,
    name: "Support",
    baseAtk: 1000,
    actions: {
        arts: { multiplier: 0, buffs: [{ type: "atk_up", value: 30, target: "party" }] }
    }
};

const enemyStats = { def: 0 };

console.log("--- Buff Stacking Rules Verification ---");

// Attacker TA (100%) + Support Arts (30%) -> Effective 100% (only Max of Action category wins)
const party1 = [
    { unit: attacker, equips: [], selectedAction: 'trueArts' },
    { unit: support, equips: [], selectedAction: 'arts' }
];
const result1 = calculatePartyOutputs(party1, enemyStats);
const log1 = result1.logs.find(l => l.unitName === "Attacker");
console.log(`Test 1 (Arts + Arts): Damage = ${log1.damage} (Expected 74667)`);
if (Math.abs(log1.damage - 74667) < 10) console.log("Test 1: PASS");
else console.error("Test 1: FAIL");

// Test 2: Arts vs Equip (Different Categories) -> Should stack (100% + 50% = 150%)
const party2 = [
    {
        unit: attacker,
        equips: [{ name: "Sword", multiplier: 0, buffs: [{ type: "atk_up", value: 50, target: "party" }] }],
        selectedAction: 'trueArts'
    }
];
const result2 = calculatePartyOutputs(party2, enemyStats);
const log2 = result2.logs.find(l => l.unitName === "Attacker");
console.log(`Test 2 (Arts + Equip): Damage = ${log2.damage} (Expected 82353)`);
if (Math.abs(log2.damage - 82353) < 10) console.log("Test 2: PASS");
else console.error("Test 2: FAIL");

// Test 3: Overlap = true -> Should stack regardless of category (100% + 30% = 130%)
const party3 = [
    { unit: attacker, equips: [], selectedAction: 'trueArts' },
    { unit: support, equips: [], selectedAction: 'arts' },
    { unit: { ...support, id: 3, actions: { arts: { buffs: [{ type: "atk_up", value: 30, target: "party", overlap: true }] } } }, equips: [], selectedAction: 'arts' }
];
const result3 = calculatePartyOutputs(party3, enemyStats);
const log3 = result3.logs.find(l => l.unitName === "Attacker");
console.log(`Test 3 (Arts + Overlap Arts): Damage = ${log3.damage} (Expected 79507)`);
if (Math.abs(log3.damage - 79507) < 10) console.log("Test 3: PASS");
else console.error("Test 3: FAIL");

// Test 4: Self vs Party (Different Scopes) -> Should stack (100% party + 50% self = 150%)
const party4 = [
    {
        unit: { ...attacker, abilities: [{ type: "atk_up", value: 50, target: "self" }] },
        equips: [],
        selectedAction: 'trueArts'
    }
];
const result4 = calculatePartyOutputs(party4, enemyStats);
const log4 = result4.logs.find(l => l.unitName === "Attacker");
console.log(`Test 4 (Party + Self): Damage = ${log4.damage} (Expected 82353)`);
if (Math.abs(log4.damage - 82353) < 10) console.log("Test 4: PASS");
else console.error("Test 4: FAIL");

// Test 5: Debuffs Stacking with Damage Up (100% Atk Up -> 74667, then * 1.5 multiplier)
const party5 = [
    {
        unit: {
            ...attacker, actions: {
                ...attacker.actions, trueArts: {
                    multiplier: 20000, type: "物理", buffs: [
                        { type: "atk_up", value: 100, target: "party" },
                        { type: "phys_res_down", value: 50, target: "enemy" }
                    ]
                }
            }
        },
        equips: [],
        selectedAction: 'trueArts'
    }
];
const result5 = calculatePartyOutputs(party5, enemyStats);
const log5 = result5.logs.find(l => l.unitName === "Attacker");
console.log(`Test 5 (Atk Up + Phys Res Down): Damage = ${log5.damage} (Expected 112000)`);
if (Math.abs(log5.damage - 112000) < 10) console.log("Test 5: PASS");
else console.error("Test 5: FAIL");
