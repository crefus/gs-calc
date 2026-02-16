import { calculatePartyOutputs } from './src/utils/calculation.js';

const mockUnitFire = {
    id: 999,
    name: "火属性ユニット",
    element: "火",
    baseAtk: 2000,
    actions: {
        trueArts: {
            multiplier: 10000,
            type: "物理",
            element: "火",
            buffs: []
        }
    }
};

const mockUnitWater = {
    id: 998,
    name: "水属性ユニット",
    element: "水",
    baseAtk: 2000,
    actions: {
        trueArts: {
            multiplier: 10000,
            type: "魔法",
            element: "水",
            buffs: []
        }
    }
};

const party = [
    {
        unit: mockUnitFire,
        equips: [
            {
                name: "物理バフ装備",
                buffs: [{ type: 'phys_dmg_up', value: 50, target: 'party' }]
            },
            {
                name: "火属性ダメバフ装備",
                buffs: [{ type: 'elem_dmg_up', value: 30, target: 'party', target_element: '火' }]
            }
        ],
        selectedAction: 'trueArts'
    },
    {
        unit: mockUnitWater,
        equips: [
            {
                name: "魔法バフ装備",
                buffs: [{ type: 'mag_dmg_up', value: 40, target: 'party' }]
            },
            {
                name: "火ユニット用バフ装備",
                buffs: [{ type: 'elem_unit_dmg_up', value: 20, target: 'party', target_element: '火' }]
            }
        ],
        selectedAction: 'trueArts'
    }
];

const result = calculatePartyOutputs(party, { def: 0 });

console.log("--- Specialized Buff Verification ---");

result.logs.forEach(log => {
    console.log(`${log.unitName} (${log.action}): ${log.damage}`);
});

/**
 * Expected Calculation:
 * 
 * 1. Fire Unit (Physical, Fire):
 *    Base: 2000 * 100 (10000%) = 200,000
 *    Buffs:
 *      - phys_dmg_up: 50
 *      - elem_dmg_up (Fire): 30
 *      - elem_unit_dmg_up (Fire): 20
 *      Total DMG UP: 100%
 *    Final: 200,000 * (1 + 100/100) = 400,000
 *    Crit: 400,000 * 1.25 = 500,000
 * 
 * 2. Water Unit (Magic, Water):
 *    Base: 2000 * 100 (10000%) = 200,000
 *    Buffs:
 *      - mag_dmg_up: 40
 *      Total DMG UP: 40%
 *    Final: 200,000 * (1 + 40/100) = 280,000
 *    Crit: 280,000 * 1.25 = 350,000
 */

const fireDmg = result.logs.find(l => l.unitName === "火属性ユニット").damage;
const waterDmg = result.logs.find(l => l.unitName === "水属性ユニット").damage;

if (Math.abs(fireDmg - 63637) < 10) {
    console.log("Fire Unit Test: PASS");
} else {
    console.error(`Fire Unit Test: FAIL. Got ${fireDmg}, Expected 63637`);
}

if (Math.abs(waterDmg - 44546) < 10) {
    console.log("Water Unit Test: PASS");
} else {
    console.error(`Water Unit Test: FAIL. Got ${waterDmg}, Expected 44546`);
}
