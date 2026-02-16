/**
 * Grand Summoners Damage Calculation Logic
 */

/**
 * Basic Damage Formula
 * (For the purpose of this simulator, we use a simplified standard RPG formula unless exact formula is provided)
 * 
 * Damage = (TotalATK * SkillMultiplier) / EnemyDEF * DmgMultipliers * Crit * ElemAdvantage * Break
 * 
 * However, GS formula usually includes flat constants. We will use a standard approximation:
 * Damage = ({ (TotalATK - EnemyDEF) * SkillMultiplier / 100 } * DmgIncrease / 100) * Crit * Elem * RandomVariance
 * 
 * If (TotalATK - EnemyDEF) <= 0, damage is minimal (1).
 * 
 * Note: SkillMultiplier in % (18000 means 18000%).
 */

export const calculateHit = ({
    unitAtk = 0,
    unitDef = 0,
    skillMulti = 0,
    enemyDef = 0,
    defIgnore = 0,
    totalDmgUp = 0,
    critDmgUp = 0,
    enemyDmgTaken = 0,
    critRate = 0, // % chance (0-100)
    superCritRate = 0, // % within crit (0-100)
    elemAdvantage = 1.0,
    isBreak = false,
    dmgType = '物理', // '物理' or '魔法'
    element = '無', // '火', '水', '樹', '光', '闇', '無'
    enemyResists = { physical: 0, magic: 0, elements: {} },
    debuffs = { phys_res_down: 0, mag_res_down: 0, elem_res_down: {}, dmg_taken_up: 0, crit_res_down: 0 }
}) => {
    // 1. Calculate Effective Resistance
    let effectiveResist = 0;
    if (dmgType === '物理') effectiveResist += (enemyResists.physical || 0) - (debuffs.phys_res_down || 0);
    if (dmgType === '魔法') effectiveResist += (enemyResists.magic || 0) - (debuffs.mag_res_down || 0);

    const elemRes = (enemyResists.elements && enemyResists.elements[element]) || 0;
    const elemDebuff = (debuffs.elem_res_down && debuffs.elem_res_down[element]) || 0;
    effectiveResist += elemRes - elemDebuff;

    // dmg_taken_up and resistance_down are typically additive in GS debuff calculations
    const combinedDebuff = (enemyDmgTaken || 0) - effectiveResist;
    const debuffMultiplier = (1 + combinedDebuff / 100);

    // 2. Calculate Effective Defense
    const effectiveDef = enemyDef * (100 - defIgnore) / 100;

    // 3. Attack Scaling Factor
    const atkFactor = unitAtk * 700 / (3500 + unitAtk);

    // 4. Defense Factor (Normal)
    // Formula provided by user: {1-防御力×(100-防御力無視)÷100÷[5000+防御力×(100-防御力無視)÷100]}
    const defFactorNormal = 1 - effectiveDef / (5000 + effectiveDef);

    // Defense Factor (Critical: Ignore Defense -> 1.0)
    const defFactorCrit = 1.0;

    // 4. Base Damage (Before Crit)
    // Non-Crit Base
    const baseDmgNonCrit = atkFactor * defFactorNormal * (skillMulti / 100);
    // Crit Base
    const baseDmgCrit = atkFactor * defFactorCrit * (skillMulti / 100);

    // 5. Apply DMG Multipliers (Common)
    // 5. Apply DMG Multipliers (Common)
    const dmgMultiplier = (1 + totalDmgUp / 100) * debuffMultiplier;

    const finalNonCrit = baseDmgNonCrit * dmgMultiplier;

    // For Crit, GS math typically applies Skill DMG UP and Crit DMG UP additively
    const dmgMultiplierCrit = (1 + (totalDmgUp + critDmgUp) / 100) * debuffMultiplier;
    const finalCritBase = baseDmgCrit * dmgMultiplierCrit;

    // 6. Calculate Expected Value
    // Probabilities
    const cRate = Math.min(100, Math.max(0, critRate + (debuffs.crit_res_down || 0))) / 100;
    const scRate = Math.min(100, Math.max(0, superCritRate)) / 100;

    // Crit Multipliers
    const modNormalCrit = 1.25;
    const modSuperCrit = 3.0;

    // Expected Damage Components
    // A. Non-Crit Damage (Chance: 1 - cRate)
    const damageA = finalNonCrit;

    // B. Critical Damage (Chance: cRate)
    //    Within Crit: 
    //      Super Crit (Chance: scRate) -> Multi: 3.0
    //      Normal Crit (Chance: 1 - scRate) -> Multi: 1.25
    const critMultiplierExpectation = (modNormalCrit * (1 - scRate)) + (modSuperCrit * scRate);
    const damageB = finalCritBase * critMultiplierExpectation;

    // Final Expected Value
    let expectedDmg = (damageA * (1 - cRate)) + (damageB * cRate);

    // 7. Apply Resistance (Already integrated into debuffMultiplier)
    // expectedDmg = expectedDmg * resistanceMultiplier; // REMOVED

    // 8. Element (Elemental Advantage - already includes base elem calc, but keeping separate)
    expectedDmg = expectedDmg * elemAdvantage;

    // 9. Break
    if (isBreak) {
        expectedDmg = expectedDmg * 1.25;
    }

    return Math.ceil(expectedDmg);
};

/**
 * Checks if a specific button is active on a unit.
 * Supports both single button object and array of buttons.
 * Now also supports buttonId as an array of conditions (all must be true).
 * Special keyword "is_leader" checks if the unit is the leader.
 */
const checkButtonActive = (unit, buttonId) => {
    if (!unit || !buttonId) return false;

    // If buttonId is an array, check ALL conditions (AND logic)
    if (Array.isArray(buttonId)) {
        return buttonId.every(id => checkButtonActive(unit, id));
    }

    // Special keyword: "is_leader"
    if (buttonId === 'is_leader') {
        return unit.isLeader === true;
    }

    // Regular button check
    if (!unit.button) return false;

    if (Array.isArray(unit.button)) {
        const btn = unit.button.find(b => b.id === buttonId);
        return btn ? btn.value === true : false;
    }

    return unit.button.id === buttonId && unit.button.value === true;
};

/**
 * Applies conditional enhancements (rates/adds) to a list of buffs.
 */
const processBuffsWithConditions = (buffs, unit, globalConditionalData) => {
    if (!buffs || !Array.isArray(buffs)) return [];

    const globalConditionals = Array.isArray(globalConditionalData) ? globalConditionalData : (globalConditionalData ? [globalConditionalData] : []);
    return buffs.map(b => {
        // Use buff-specific conditional if it exists, otherwise fall back to global
        const cData = b.conditional || globalConditionals.find(c => checkButtonActive(unit, c.buttonId));

        // Debug logging
        if (b.conditional) {
            console.log('[Conditional Debug]', {
                unitName: unit?.name,
                buffType: b.type,
                buffValue: b.value,
                buttonId: b.conditional.buttonId,
                isActive: checkButtonActive(unit, b.conditional.buttonId),
                buffAdd: b.conditional.buffAdd,
                buffRate: b.conditional.buffRate,
                unitButtons: unit?.button
            });
        }

        if (!cData || !checkButtonActive(unit, cData.buttonId)) return { ...b };

        const rate = cData.buffRate || 1.0;
        const add = cData.buffAdd || 0;

        // For string expressions, store conditional info for later application
        if (typeof b.value === 'string') {
            console.log('[Conditional Stored for Expression]', {
                unitName: unit?.name,
                buffType: b.type,
                expression: b.value,
                rate,
                add
            });
            return {
                ...b,
                _conditionalRate: rate,
                _conditionalAdd: add
            };
        }

        // For numeric values, apply immediately
        const newValue = b.value * rate + add;
        console.log('[Conditional Applied]', {
            unitName: unit?.name,
            buffType: b.type,
            originalValue: b.value,
            newValue,
            rate,
            add
        });

        return {
            ...b,
            value: newValue
        };
    });
};

// Helper to aggregate buffs based on stacking rules
const aggregateBuffs = (buffs) => {
    const groups = {};
    const result = {
        atk_up_percent: 0,
        atk_up_flat: 0,
        def_up_percent: 0,
        def_up_flat: 0,
        hp_up_percent: 0,
        hp_up_flat: 0,
        dmg_up: 0,
        phys_dmg_up: 0,
        mag_dmg_up: 0,
        elem_dmg_up: {},
        elem_equip_dmg_up: {},
        crit_dmg_up: 0,
        def_ignore: 0,
        crit_rate_up: 0,
        super_crit_rate_up: 0,
        all_arts_dmg_up: 0,
        arts_dmg_up: 0,
        true_arts_dmg_up: 0,
        super_arts_dmg_up: 0,
        pb_dmg_up: 0,
        skill_dmg_up: 0,
        equip_dmg_up: 0,
        phys_res_down: 0,
        mag_res_down: 0,
        elem_res_down: {},
        dmg_taken_up: 0,
        crit_res_down: 0,
        enemy_atk_down: 0,
        enemy_def_down: 0,
        enemy_hp_down: 0
    };

    buffs.forEach(b => {
        if (!b || !b.type) return;

        if (b.overlap) {
            applyBuffValue(result, b);
            return;
        }

        const category = b.category || 'ability';
        const scope = b.target || 'self';
        const sourceId = b.sourceIdx !== undefined ? `source${b.sourceIdx}` : (b.sourceName || 'unknown');
        const buffId = b.buffIdx !== undefined ? `buff${b.buffIdx}` : '';

        // For equipment, same names don't stack. Use name for grouping.
        // For others, use sourceId to allow different units' buffs to stack.
        const effectiveSourceId = category === 'equip' ? (b.sourceName || sourceId) : sourceId;

        let key;
        // If tag exists, use it for grouping and compare by tagLevel
        if (b.tag) {
            key = `TAG_${b.tag}_${scope}`;
            const existing = groups[key];
            const currentLevel = b.tagLevel || 0;
            const existingLevel = existing ? (existing.tagLevel || 0) : -1;

            if (currentLevel > existingLevel) {
                groups[key] = b;
            }
        } else {
            // Normal grouping key - include overlap status if it should always stack
            key = `${b.type}_${b.target_element || ''}_${b.target_race || ''}_${scope}_${category}_${effectiveSourceId}_${buffId}`;
            if (!groups[key] || b.value > groups[key].value) {
                groups[key] = b;
            }
        }

        // DEBUG: Track grouping (only log detailed info for atk_up to reduce noise)
        if (window.__DEBUG_LOGS__ && (b.type === 'atk_up' || b.type === 'atk_up_percent')) {
            window.__DEBUG_LOGS__.push({ msg: `[Calc Debug] Grouping Buff: ${key} -> ${b.value}`, buff: b });
        }
    });

    Object.values(groups).forEach(b => {
        applyBuffValue(result, b);
        // DEBUG: Track application
        if (window.__DEBUG_LOGS__ && (b.type === 'atk_up' || b.type === 'atk_up_percent')) {
            window.__DEBUG_LOGS__.push({ msg: `[Calc Debug] Applied Buff to Result: ${b.value}`, buff: b });
        }
    });

    // DEBUG: Final Result
    if (window.__DEBUG_LOGS__ && result.atk_up_percent > 0) {
        window.__DEBUG_LOGS__.push({ msg: `[Calc Debug] Final Result atk_up_percent: ${result.atk_up_percent}`, result });
    }

    return result;
};

const applyBuffValue = (res, b) => {
    const types = Array.isArray(b.type) ? b.type : [b.type];

    types.forEach(type => {
        if (type === 'dmg_up') res.dmg_up += b.value;
        if (type === 'atk_up' || type === 'atk_up_percent') res.atk_up_percent += b.value;
        if (type === 'atk_up_flat') res.atk_up_flat += b.value;
        if (type === 'def_up' || type === 'def_up_percent') res.def_up_percent += b.value;
        if (type === 'def_up_flat') res.def_up_flat += b.value;
        if (type === 'hp_up' || type === 'hp_up_percent') res.hp_up_percent += b.value;
        if (type === 'hp_up_flat') res.hp_up_flat += b.value;
        if (type === 'phys_dmg_up') res.phys_dmg_up += b.value;
        if (type === 'mag_dmg_up') res.mag_dmg_up += b.value;
        if (type === 'elem_dmg_up' && (b.target_element || b.element)) {
            const elements = Array.isArray(b.target_element || b.element) ? (b.target_element || b.element) : [b.target_element || b.element];
            elements.forEach(el => {
                res.elem_dmg_up[el] = (res.elem_dmg_up[el] || 0) + b.value;
            });
        }
        if (type === 'elem_equip_dmg_up' && (b.target_element || b.element)) {
            const elements = Array.isArray(b.target_element || b.element) ? (b.target_element || b.element) : [b.target_element || b.element];
            elements.forEach(el => {
                res.elem_equip_dmg_up[el] = (res.elem_equip_dmg_up[el] || 0) + b.value;
            });
        }
        if (type === 'status_up') {
            res.atk_up_percent += b.value;
            res.def_up_percent += b.value;
            res.hp_up_percent += b.value;
        }
        if (type === 'status_up_flat') {
            res.atk_up_flat += b.value;
            res.def_up_flat += b.value;
            res.hp_up_flat += b.value;
        }
        if (type === 'atk_down') {
            if (b.target === 'enemy') res.enemy_atk_down += b.value;
            else res.atk_up_percent -= b.value;
        }
        if (type === 'def_down') {
            if (b.target === 'enemy') res.enemy_def_down += b.value;
            else res.def_up_percent -= b.value;
        }
        if (type === 'hp_down') {
            if (b.target === 'enemy') res.enemy_hp_down += b.value;
            else res.hp_up_percent -= b.value;
        }
        if (type === 'status_down') {
            if (b.target === 'enemy') {
                res.enemy_atk_down += b.value;
                res.enemy_def_down += b.value;
                res.enemy_hp_down += b.value;
            } else {
                res.atk_up_percent -= b.value;
                res.def_up_percent -= b.value;
                res.hp_up_percent -= b.value;
            }
        }
        if (type === 'all_arts_dmg_up') res.all_arts_dmg_up += b.value;
        if (type === 'arts_dmg_up') res.arts_dmg_up += b.value;
        if (type === 'true_arts_dmg_up') res.true_arts_dmg_up += b.value;
        if (type === 'super_arts_dmg_up') res.super_arts_dmg_up += b.value;
        if (type === 'pb_dmg_up') res.pb_dmg_up += b.value;
        if (type === 'skill_dmg_up') res.skill_dmg_up += b.value;
        if (type === 'equip_dmg_up') res.equip_dmg_up += b.value;
        if (type === 'crit_dmg_up') res.crit_dmg_up += b.value;
        if (type === 'critical_up' || type === 'crit_rate_up') res.crit_rate_up += b.value;
        if (type === 'super_critical_up' || type === 'super_crit_rate_up') res.super_crit_rate_up += b.value;
        if (type === 'def_ignore') res.def_ignore += b.value;

        // Debuffs
        if (type === 'phys_res_down') res.phys_res_down += b.value;
        if (type === 'mag_res_down') res.mag_res_down += b.value;
        if (type === 'dmg_taken_up') res.dmg_taken_up += b.value;
        if (type === 'crit_res_down') res.crit_res_down += b.value;
        if (type === 'elem_res_down' && (b.target_element || b.element)) {
            const elements = Array.isArray(b.target_element || b.element) ? (b.target_element || b.element) : [b.target_element || b.element];
            elements.forEach(el => {
                res.elem_res_down[el] = (res.elem_res_down[el] || 0) + b.value;
            });
        }
    });
};

export const calculatePartyOutputs = (party, enemyStats) => {
    // Calculate party composition counts
    const activeUnits = party.filter(m => m.unit);
    const uniqueRaces = new Set(activeUnits.map(m => m.unit.race).filter(r => r));
    const uniqueElements = new Set(activeUnits.map(m => m.unit.element).filter(e => e));

    // Specific counts
    const raceCounts = {};
    const elementCounts = {};
    activeUnits.forEach(m => {
        const r = m.unit.race;
        const e = m.unit.element;
        if (r) raceCounts[r] = (raceCounts[r] || 0) + 1;
        if (e) elementCounts[e] = (elementCounts[e] || 0) + 1;
    });

    const context = {
        party_race_count: uniqueRaces.size,
        party_element_count: uniqueElements.size,
        party_unique_race_count: uniqueRaces.size,
        party_unique_element_count: uniqueElements.size
    };

    // Add specific race counts: party_人族_count etc.
    Object.entries(raceCounts).forEach(([race, count]) => {
        context[`party_${race}_count`] = count;
    });
    // Add specific element counts: party_炎_count etc.
    Object.entries(elementCounts).forEach(([elem, count]) => {
        context[`party_${elem}_count`] = count;
    });

    // Helper to evaluate dynamic values
    const evaluateValue = (val, localContext = {}) => {
        if (typeof val !== 'string') return parseFloat(val) || 0;
        let expression = val;
        const combinedContext = { ...context, ...localContext };

        // Replace variables with values. Sort keys by length descending to avoid partial matches
        const sortedKeys = Object.keys(combinedContext).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
            const value = combinedContext[key];
            // If key contains non-word characters (like Japanese), don't use \b
            const isWord = /^[a-zA-Z0-9_]+$/.test(key);
            const pattern = isWord ? `\\b${key}\\b` : key;
            expression = expression.replace(new RegExp(pattern, 'g'), value);
        }

        // Fallback: replace common prefixes that weren't in context with 0 to prevent eval errors
        expression = expression.replace(/\b(self_race_|self_element_|party_|target_race_|target_element_)[^\s\+\-\*\/\(\)\=><?:]+\b/g, '0');

        try {
            // Safe evaluation of math expressions (supports +, -, *, /, parenthesis)
            // eslint-disable-next-line no-eval
            return eval(expression);
        } catch (e) {
            console.error("Failed to evaluate expression:", expression, e);
            return 0;
        }
    };

    const allGlobalBuffs = [];

    party.forEach((member, sourceIdx) => {
        if (!member.unit) return;

        const equipStats = (member.equips || []).reduce((acc, eq) => {
            if (eq && eq.stats) {
                acc.hp += Number(eq.stats.hp || 0);
                acc.atk += Number(eq.stats.atk || 0);
                acc.def += Number(eq.stats.def || 0);
            }
            return acc;
        }, { hp: 0, atk: 0, def: 0 });

        const baseAtk = Number((member.customStats && member.customStats.atk) || member.unit.baseAtk || 0) + Number(member.tasAtk || 0) + equipStats.atk;
        const baseDef = Number((member.customStats && member.customStats.def) || member.unit.baseDef || 0) + Number(member.tasDef || 0) + equipStats.def;
        const baseHp = Number((member.customStats && member.customStats.hp) || member.unit.baseHp || 0) + Number(member.tasHP || 0) + equipStats.hp;

        const currentHpRate = member.hpRate !== undefined ? Number(member.hpRate) : 1.0;

        // Calculate HP Consumption
        const actionTypeUsed = member.selectedAction || 'trueArts';
        const actionDataUsed = (member.unit.actions && member.unit.actions[actionTypeUsed]) || {};
        const actionHpConsumption = actionDataUsed.hpConsumption || 0;
        const equipHpConsumption = (member.equips || []).reduce((sum, eq, eqIdx) => {
            const isEnabled = member.equipEnabled ? member.equipEnabled[eqIdx] : true;
            if (isEnabled && eq && eq.hpConsumption) return sum + eq.hpConsumption;
            return sum;
        }, 0);
        const totalHpConsumption = (actionHpConsumption + equipHpConsumption) / 100;
        const effectiveHpRate = Math.max(0, currentHpRate - totalHpConsumption);

        const localCtx = {
            is_leader: member.isLeader ? 1 : 0,
            self_base_atk: baseAtk,
            self_base_def: baseDef,
            self_base_hp: baseHp,
            self_atk: baseAtk,
            self_def: baseDef,
            self_hp: baseHp,
            hp_rate: effectiveHpRate,
            self_hp_current: baseHp * effectiveHpRate,
            raw_hp_rate: currentHpRate
        };
        // Add wearer attributes as variables
        if (member.unit.race) localCtx[`self_race_${member.unit.race}`] = 1;
        if (member.unit.element) localCtx[`self_element_${member.unit.element}`] = 1;

        if (member.unit.abilities) {
            // Apply conditional logic to abilities
            const processedAbilities = processBuffsWithConditions(member.unit.abilities, member.unit);

            // Store processed abilities for later reuse
            member.unit._processedAbilities = processedAbilities.map(ability => {
                const b = { ...ability, category: 'ability', sourceIdx, buffIdx: 0, originalValue: ability.value };
                b.value = evaluateValue(b.originalValue, localCtx);

                // Apply stored conditional buffs after evaluation
                if (ability._conditionalRate !== undefined || ability._conditionalAdd !== undefined) {
                    const rate = ability._conditionalRate || 1.0;
                    const add = ability._conditionalAdd || 0;
                    b.value = b.value * rate + add;
                    console.log('[Conditional Applied After Evaluation]', {
                        unitName: member.unit.name,
                        buffType: b.type,
                        evaluatedValue: evaluateValue(b.originalValue, localCtx),
                        finalValue: b.value,
                        rate,
                        add
                    });
                }

                return b;
            });

            processedAbilities.forEach((ability, buffIdx) => {
                const b = member.unit._processedAbilities[buffIdx];
                const scope = b.target || 'self';
                if (['party', 'enemy', 'leader', 'left', 'right', 'both_sides', 'other', 'element', 'race', 'select'].includes(scope)) {
                    allGlobalBuffs.push(b);
                }
            });
        }

        member.equips.forEach((eq, eqIdx) => {
            const isEnabled = member.equipEnabled ? member.equipEnabled[eqIdx] : true;
            if (!isEnabled || !eq) return;

            // Combine buffs and abilities for global collection
            const eqBuffs = eq.buffs || [];
            const eqAbilities = Array.isArray(eq.ability) ? eq.ability : (eq.ability && typeof eq.ability === 'object' && Object.keys(eq.ability).length > 0 ? [eq.ability] : []);
            const allEqEffects = [...eqBuffs, ...eqAbilities];

            if (allEqEffects.length === 0) return;

            // Apply conditional logic
            const processedEffects = processBuffsWithConditions(allEqEffects, member.unit, allEqEffects.map(b => b.conditional).filter(c => c));

            processedEffects.forEach((buff, buffIdx) => {
                const b = {
                    ...buff,
                    category: 'equip',
                    sourceIdx,
                    sourceName: eq.name,
                    buffIdx: `${eqIdx}_${buffIdx}`,
                    originalValue: buff.value
                };
                const scope = b.target || 'self';
                if (scope === 'select') {
                    const targetIdx = (member.equipTargetIndices && member.equipTargetIndices[eqIdx] !== undefined) ? member.equipTargetIndices[eqIdx] : 0;
                    const targetUnit = party[targetIdx]?.unit;
                    const evalCtx = { ...localCtx };
                    if (targetUnit) {
                        if (targetUnit.race) evalCtx[`target_race_${targetUnit.race}`] = 1;
                        if (targetUnit.element) evalCtx[`target_element_${targetUnit.element}`] = 1;
                    }
                    b.value = evaluateValue(b.originalValue, evalCtx);
                    allGlobalBuffs.push({ ...b, targetIdx });
                } else if (['party', 'enemy', 'leader', 'left', 'right', 'both_sides', 'other', 'element', 'race'].includes(scope)) {
                    b.value = evaluateValue(b.originalValue, localCtx);
                    allGlobalBuffs.push(b);
                }
            });
        });

        const actionType = member.selectedAction || 'trueArts';
        let actionData = (member.unit.actions && member.unit.actions[actionType]);
        if (actionData && actionData.buffs) {
            // Support multiple conditionals on super arts/actions
            const processedActionBuffs = processBuffsWithConditions(actionData.buffs, member.unit, actionData.conditional);

            processedActionBuffs.forEach((buff, buffIdx) => {
                const b = { ...buff, category: 'action', sourceIdx, buffIdx, originalValue: buff.value };
                b.value = evaluateValue(b.originalValue, localCtx);
                const scope = b.target || 'self';
                if (['party', 'enemy', 'leader', 'left', 'right', 'both_sides', 'other', 'element', 'race', 'select'].includes(scope)) {
                    allGlobalBuffs.push(b);
                }
            });
        }
    });

    const aggregatedGlobal = aggregateBuffs(allGlobalBuffs.filter(b => b.target === 'enemy'));

    // Pass 1: Calculate initial final stats for everyone
    const partyStatsPass1 = party.map((member, currentIdx) => {
        if (!member.unit) return { atk: 0, def: 0, hp: 0, selfBuffs: [] };

        const equipStats = (member.equips || []).reduce((acc, eq) => {
            if (eq && eq.stats) {
                acc.hp += Number(eq.stats.hp || 0);
                acc.atk += Number(eq.stats.atk || 0);
                acc.def += Number(eq.stats.def || 0);
            }
            return acc;
        }, { hp: 0, atk: 0, def: 0 });

        const baseAtk = Number((member.customStats && member.customStats.atk) || member.unit.baseAtk || 0) + Number(member.tasAtk || 0) + equipStats.atk;
        const baseDef = Number((member.customStats && member.customStats.def) || member.unit.baseDef || 0) + Number(member.tasDef || 0) + equipStats.def;
        const baseHp = Number((member.customStats && member.customStats.hp) || member.unit.baseHp || 0) + Number(member.tasHP || 0) + equipStats.hp;

        // Calculate effective HP Rate after consumption for this member again
        const currentHpRate = member.hpRate !== undefined ? Number(member.hpRate) : 1.0;
        const actionTypeUsed = member.selectedAction || 'trueArts';
        const actionDataUsed = (member.unit.actions && member.unit.actions[actionTypeUsed]) || {};
        const actionHpConsumption = actionDataUsed.hpConsumption || 0;
        const equipHpConsumption = (member.equips || []).reduce((sum, eq, eqIdx) => {
            const isEnabled = member.equipEnabled ? member.equipEnabled[eqIdx] : true;
            if (isEnabled && eq && eq.hpConsumption) return sum + eq.hpConsumption;
            return sum;
        }, 0);
        const totalHpConsumption = (actionHpConsumption + equipHpConsumption) / 100;
        const effectiveHpRate = Math.max(0, currentHpRate - totalHpConsumption);

        const localCtx = {
            is_leader: member.isLeader ? 1 : 0,
            self_base_atk: baseAtk,
            self_base_def: baseDef,
            self_base_hp: baseHp,
            self_atk: baseAtk,
            self_def: baseDef,
            self_hp: baseHp,
            hp_rate: effectiveHpRate,
            self_hp_current: baseHp * effectiveHpRate,
            raw_hp_rate: currentHpRate
        };
        if (member.unit.race) localCtx[`self_race_${member.unit.race}`] = 1;
        if (member.unit.element) localCtx[`self_element_${member.unit.element}`] = 1;

        const unitSelfBuffs = [];
        const unit = member.unit; // Define unit for clarity in filters
        const i = currentIdx; // Define i for clarity in filters
        const leaderIdx = party.findIndex(p => p.isLeader); // Find leader index

        // Target-specific buffs for this unit
        const unitSpecificBuffs = allGlobalBuffs.filter(b => {
            // Unified attribute filtering
            if (b.target_element || b.element) {
                const targetEls = Array.isArray(b.target_element || b.element) ? (b.target_element || b.element) : [b.target_element || b.element];
                if (!targetEls.includes(unit.element)) return false;
            }
            if (b.target_race || b.race) {
                const targetRaces = Array.isArray(b.target_race || b.race) ? (b.target_race || b.race) : [b.target_race || b.race];
                if (!targetRaces.includes(unit.race)) return false;
            }

            if (b.target === 'party') return true;
            if ((b.target === 'element' || b.target === 'race') && !b.element && !b.target_element && !b.race && !b.target_race) {
                // If it's element/race target but has no criteria, treat as party (though usually it should have criteria)
                return true;
            }
            if (b.target === 'element' || b.target === 'race') return true; // Already passed criteria checks above
            if (b.target === 'self' && Number(b.sourceIdx) === Number(i)) return true;
            if (b.target === 'other' && Number(b.sourceIdx) !== Number(i)) return true;
            if (b.target === 'leader' && Number(i) === Number(leaderIdx)) return true;
            if (b.target === 'select' && Number(b.targetIdx) === Number(i)) return true;
            if (b.target === 'left' && Number(b.sourceIdx) === Number(i) + 1) return true;
            if (b.target === 'right' && Number(b.sourceIdx) === Number(i) - 1) return true;
            if (b.target === 'both_sides' && (Number(b.sourceIdx) === Number(i) + 1 || Number(b.sourceIdx) === Number(i) - 1)) return true;
            return false;
        });

        // console.log(`Unit ${i} (${unit.name}) unitSpecificBuffs:`, unitSpecificBuffs.map(b => `${b.type} (from ${b.sourceIdx}, target ${b.target})`)); // Removed console.log

        unitSelfBuffs.push(...unitSpecificBuffs);

        if (member.unit.abilities) {
            // Use pre-processed abilities if available (includes conditional buffs)
            const abilitiesToUse = member.unit._processedAbilities ||
                processBuffsWithConditions(member.unit.abilities, member.unit).map(a => ({
                    ...a,
                    value: evaluateValue(a.value, localCtx)
                }));

            abilitiesToUse.forEach((a, buffIdx) => {
                if ((a.target || 'self') === 'self') {
                    unitSelfBuffs.push({ ...a, category: 'ability', sourceIdx: currentIdx, buffIdx });
                }
            });
        }

        member.equips.forEach((eq, eqIdx) => {
            const isEnabled = member.equipEnabled ? member.equipEnabled[eqIdx] : true;
            if (!isEnabled || !eq) return;

            const eqBuffs = eq.buffs || [];
            const eqAbilities = Array.isArray(eq.ability) ? eq.ability : (eq.ability && typeof eq.ability === 'object' && Object.keys(eq.ability).length > 0 ? [eq.ability] : []);

            // DEBUG: Check equipment capability
            if (!window.__DEBUG_LOGS__) window.__DEBUG_LOGS__ = [];
            window.__DEBUG_LOGS__.push({ msg: `[Calc Debug] Equip ${eq.name}`, buffs: eqBuffs, abilities: eqAbilities });

            const allEqEffects = [...eqBuffs, ...eqAbilities];

            const processedEquipEffects = processBuffsWithConditions(allEqEffects, member.unit);

            // DEBUG: Check processed effects
            if (allEqEffects.length > 0) {
                window.__DEBUG_LOGS__.push({ msg: `[Calc Debug] Equip ${eq.name} processed`, processed: processedEquipEffects });
            }

            processedEquipEffects.forEach((b, buffIdx) => {
                if ((b.target || 'self') === 'self') {
                    console.log(`[Calc Debug] Adding buff to unitSelfBuffs:`, b);
                    unitSelfBuffs.push({ ...b, category: 'equip', sourceIdx: currentIdx, buffIdx: `${eqIdx}_${buffIdx}`, originalValue: b.value, value: evaluateValue(b.value, localCtx) });
                }
            });
        });

        if (member.crests && Array.isArray(member.crests)) {
            member.crests.forEach(c => {
                if (c && c.buff) {
                    unitSelfBuffs.push({ ...c.buff, category: 'crest', sourceIdx: currentIdx, originalValue: c.buff.value, value: evaluateValue(c.buff.value, localCtx) });
                }
            });
        }

        const actionType = member.selectedAction || 'trueArts';
        const actionData = (member.unit.actions && member.unit.actions[actionType]) || { buffs: [] };
        if (actionData.buffs) {
            processBuffsWithConditions(actionData.buffs, member.unit, actionData.conditional).forEach((b, buffIdx) => {
                if ((b.target || 'self') === 'self') {
                    unitSelfBuffs.push({ ...b, category: 'action', sourceIdx: currentIdx, buffIdx, originalValue: b.value, value: evaluateValue(b.value, localCtx) });
                }
            });
        }

        // DEBUG: unitSelfBuffs content
        if (unitSelfBuffs.some(b => b.category === 'equip')) {
            window.__DEBUG_LOGS__.push({ msg: `[Calc Debug] unitSelfBuffs content for Unit ${currentIdx}`, buffs: unitSelfBuffs });
        }

        const interStats = aggregateBuffs(unitSelfBuffs);
        const bAtkP = interStats.atk_up_percent;
        const bDefP = interStats.def_up_percent;
        const bHpP = interStats.hp_up_percent;

        return {
            atk: Math.floor((baseAtk + interStats.atk_up_flat) * (1 + bAtkP / 100)),
            def: Math.floor((baseDef + interStats.def_up_flat) * (1 + bDefP / 100)),
            hp: Math.floor((baseHp + interStats.hp_up_flat) * (1 + bHpP / 100)),
            unitSelfBuffs,
            localCtx
        };
    });

    // Pass 2: Calculate FINAL Damage with fully re-evaluated dynamic buffs from all sources
    const logs = [];
    const finalPartyStats = [];
    let totalDamage = 0;

    party.forEach((member, currentIdx) => {
        if (!member.unit) return;
        const pass1 = partyStatsPass1[currentIdx];

        // Pass 2: Re-gather and re-evaluate ALL buffs (including global/party ones)
        // using the same logic as Pass 1 but with updated final stats.
        const unit = member.unit;
        const i = currentIdx;
        const leaderIdx = party.findIndex(p => p.isLeader);

        const unitSpecificBuffs = allGlobalBuffs.filter(b => {
            if (b.target_element || b.element) {
                const targetEls = Array.isArray(b.target_element || b.element) ? (b.target_element || b.element) : [b.target_element || b.element];
                if (!targetEls.includes(unit.element)) return false;
            }
            if (b.target_race || b.race) {
                const targetRaces = Array.isArray(b.target_race || b.race) ? (b.target_race || b.race) : [b.target_race || b.race];
                if (!targetRaces.includes(unit.race)) return false;
            }

            if (b.target === 'party') return true;
            if ((b.target === 'element' || b.target === 'race') && !b.element && !b.target_element && !b.race && !b.target_race) return true;
            if (b.target === 'element' || b.target === 'race') return true;
            if (b.target === 'self' && Number(b.sourceIdx) === Number(i)) return true;
            if (b.target === 'other' && Number(b.sourceIdx) !== Number(i)) return true;
            if (b.target === 'leader' && Number(i) === Number(leaderIdx)) return true;
            if (b.target === 'select' && Number(b.targetIdx) === Number(i)) return true;
            if (b.target === 'left' && Number(b.sourceIdx) === Number(i) + 1) return true;
            if (b.target === 'right' && Number(b.sourceIdx) === Number(i) - 1) return true;
            if (b.target === 'both_sides' && (Number(b.sourceIdx) === Number(i) + 1 || Number(b.sourceIdx) === Number(i) - 1)) return true;
            return false;
        });

        const reEvalBuffs = [...unitSpecificBuffs];

        if (member.unit.abilities) {
            // Use pre-processed abilities if available
            const abilitiesToUse = member.unit._processedAbilities ||
                processBuffsWithConditions(member.unit.abilities, member.unit);

            abilitiesToUse.forEach((a, buffIdx) => {
                if ((a.target || 'self') === 'self') {
                    // Use the already-evaluated value from _processedAbilities
                    reEvalBuffs.push({ ...a, category: 'ability', sourceIdx: currentIdx, buffIdx, originalValue: a.originalValue || a.value });
                }
            });
        }

        member.equips.forEach((eq, eqIdx) => {
            const isEnabled = member.equipEnabled ? member.equipEnabled[eqIdx] : true;
            if (!isEnabled || !eq) return;
            const allEq = [...(eq.buffs || []), ...(Array.isArray(eq.ability) ? eq.ability : (eq.ability ? [eq.ability] : []))];
            processBuffsWithConditions(allEq, member.unit).forEach((b, buffIdx) => {
                if ((b.target || 'self') === 'self') {
                    reEvalBuffs.push({ ...b, category: 'equip', sourceIdx: currentIdx, buffIdx: `${eqIdx}_${buffIdx}`, originalValue: b.value });
                }
            });
        });

        if (member.crests && Array.isArray(member.crests)) {
            member.crests.forEach(c => {
                if (c && c.buff) {
                    reEvalBuffs.push({ ...c.buff, category: 'crest', sourceIdx: currentIdx, originalValue: c.buff.value });
                }
            });
        }

        let actionType = member.selectedAction || 'trueArts';
        let actionData = (member.unit.actions && member.unit.actions[actionType]) || { multiplier: 0, buffs: [] };
        if (actionData.buffs) {
            processBuffsWithConditions(actionData.buffs, member.unit, actionData.conditional).forEach((b, buffIdx) => {
                if ((b.target || 'self') === 'self') {
                    reEvalBuffs.push({ ...b, category: 'action', sourceIdx: currentIdx, buffIdx, originalValue: b.value });
                }
            });
        }

        const finalSelfBuffs = reEvalBuffs.map(b => {
            if (b.value !== undefined && !b.originalValue) return b;
            const sourceIndex = b.sourceIdx !== undefined ? b.sourceIdx : currentIdx;
            const sourceStats = partyStatsPass1[sourceIndex] || pass1;
            const sourceCtx = {
                ...sourceStats.localCtx,
                self_atk: sourceStats.atk,
                self_def: sourceStats.def,
                self_hp: sourceStats.hp,
                self_hp_current: sourceStats.hp * (sourceStats.localCtx.hp_rate),
                hp_rate: sourceStats.localCtx.hp_rate,
                target_atk: pass1.atk,
                target_def: pass1.def,
                target_hp: pass1.hp,
                target_hp_current: pass1.hp * pass1.localCtx.hp_rate
            };
            const sourceUnit = party[sourceIndex]?.unit || member.unit;
            if (sourceUnit.race) sourceCtx[`self_race_${sourceUnit.race}`] = 1;
            if (sourceUnit.element) sourceCtx[`self_element_${sourceUnit.element}`] = 1;

            const targetUnit = member.unit;
            if (targetUnit.race) sourceCtx[`target_race_${targetUnit.race}`] = 1;
            if (targetUnit.element) sourceCtx[`target_element_${targetUnit.element}`] = 1;
            return { ...b, value: evaluateValue(b.originalValue || b.value, sourceCtx) };
        });

        const selfStats = aggregateBuffs(finalSelfBuffs);

        // Recalculate Attack and Defense based on final re-evaluated buffs
        // This ensures percent buffs are applied to base+flat exactly as in game
        const finalAtk = Math.floor((pass1.localCtx.self_base_atk + selfStats.atk_up_flat) * (1 + selfStats.atk_up_percent / 100));
        const finalDef = Math.floor((pass1.localCtx.self_base_def + selfStats.def_up_flat) * (1 + selfStats.def_up_percent / 100));
        const finalHp = Math.floor((pass1.localCtx.self_base_hp + selfStats.hp_up_flat) * (1 + selfStats.hp_up_percent / 100));

        finalPartyStats[currentIdx] = {
            atk: finalAtk,
            def: finalDef,
            hp: finalHp,
            stats: selfStats // optional: full buffer stats if needed
        };

        actionType = member.selectedAction || 'trueArts';
        actionData = (member.unit.actions && member.unit.actions[actionType]) || { multiplier: 0, buffs: [] };

        // Multiplier re-evaluation
        let currentMultiplier = actionData.multiplier || 0;
        const conditionals = Array.isArray(actionData.conditional) ? actionData.conditional : (actionData.conditional ? [actionData.conditional] : []);
        conditionals.filter(c => checkButtonActive(member.unit, c.buttonId)).forEach(c => {
            if (c.multiplierRate) currentMultiplier *= c.multiplierRate;
        });
        const finalAtkCtx = { ...pass1.localCtx, self_atk: finalAtk, self_def: finalDef, self_hp: finalHp };
        const evaluatedMultiplier = evaluateValue(currentMultiplier, finalAtkCtx);

        const unitElement = member.unit.element;
        const actionTypeDmg = actionData.type || '物理';
        const actionElement = actionData.element || unitElement;

        let totalDmgUpForAction = (selfStats.dmg_up || 0);
        if (actionTypeDmg === '物理') totalDmgUpForAction += (selfStats.phys_dmg_up || 0);
        if (actionTypeDmg === '魔法') totalDmgUpForAction += (selfStats.mag_dmg_up || 0);
        if (selfStats.elem_dmg_up[actionElement]) totalDmgUpForAction += selfStats.elem_dmg_up[actionElement];

        if (['arts', 'trueArts', 'superArts', 'phantomBullet'].includes(actionType)) {
            totalDmgUpForAction += (selfStats.all_arts_dmg_up || 0);
        }
        if (actionType === 'arts') totalDmgUpForAction += (selfStats.arts_dmg_up || 0);
        if (actionType === 'trueArts') totalDmgUpForAction += (selfStats.true_arts_dmg_up || 0);
        if (actionType === 'superArts') totalDmgUpForAction += (selfStats.super_arts_dmg_up || 0);
        if (actionType === 'phantomBullet') totalDmgUpForAction += (selfStats.pb_dmg_up || 0);
        if (actionType === 'skill') totalDmgUpForAction += (selfStats.skill_dmg_up || 0);

        const effectiveEnemyDef = Math.max(0, enemyStats.def * (1 - (aggregatedGlobal.enemy_def_down || 0) / 100));

        const unitDmg = calculateHit({
            unitAtk: finalAtk,
            skillMulti: evaluatedMultiplier,
            enemyDef: effectiveEnemyDef,
            defIgnore: selfStats.def_ignore,
            totalDmgUp: totalDmgUpForAction,
            critDmgUp: selfStats.crit_dmg_up,
            enemyDmgTaken: aggregatedGlobal.dmg_taken_up,
            critRate: selfStats.crit_rate_up,
            superCritRate: selfStats.super_crit_rate_up,
            elemAdvantage: 1.0,
            isBreak: false,
            dmgType: actionTypeDmg,
            element: actionElement,
            enemyResists: enemyStats.resists || { physical: 0, magic: 0, elements: {} },
            debuffs: {
                phys_res_down: aggregatedGlobal.phys_res_down,
                mag_res_down: aggregatedGlobal.mag_res_down,
                elem_res_down: aggregatedGlobal.elem_res_down,
                dmg_taken_up: 0,
                crit_res_down: aggregatedGlobal.crit_res_down
            }
        });

        logs.push({
            unitName: member.unit.name,
            action: (actionType === 'skill' ? 'スキル' : (actionType === 'arts' ? '奥義' : (actionType === 'trueArts' ? '真奥義' : (actionType === 'superArts' ? '超奥義' : 'PB')))),
            damage: unitDmg,
            stats: { atk: pass1.atk, def: pass1.def, hp: pass1.hp }
        });
        totalDamage += unitDmg;

        // Equip damage
        member.equips.forEach((eq, idx) => {
            const isEnabled = member.equipEnabled ? member.equipEnabled[idx] : true;
            if (!isEnabled || !eq || eq.multiplier <= 0) return;

            const eqType = eq.type || (eq.category && eq.category.includes('魔法') ? '魔法' : '物理');
            const eqElement = eq.element || '無';

            let eqDmgUp = selfStats.dmg_up || 0;
            if (eqType === '物理') eqDmgUp += (selfStats.phys_dmg_up || 0);
            if (eqType === '魔法') eqDmgUp += (selfStats.mag_dmg_up || 0);
            if (selfStats.elem_dmg_up[eqElement]) eqDmgUp += selfStats.elem_dmg_up[eqElement];
            eqDmgUp += (selfStats.equip_dmg_up || 0);
            if (selfStats.elem_equip_dmg_up[eqElement]) eqDmgUp += selfStats.elem_equip_dmg_up[eqElement];

            const eqDmg = calculateHit({
                unitAtk: finalAtk,
                skillMulti: eq.multiplier,
                enemyDef: effectiveEnemyDef,
                defIgnore: selfStats.def_ignore,
                totalDmgUp: eqDmgUp,
                critDmgUp: selfStats.crit_dmg_up,
                enemyDmgTaken: aggregatedGlobal.dmg_taken_up,
                critRate: 100 + (selfStats.crit_rate_up || 0),
                superCritRate: selfStats.super_crit_rate_up || 0,
                elemAdvantage: 1.0,
                isBreak: false,
                dmgType: eqType,
                element: eqElement,
                enemyResists: enemyStats.resists || { physical: 0, magic: 0, elements: {} },
                debuffs: {
                    phys_res_down: aggregatedGlobal.phys_res_down,
                    mag_res_down: aggregatedGlobal.mag_res_down,
                    elem_res_down: aggregatedGlobal.elem_res_down,
                    dmg_taken_up: 0,
                    crit_res_down: aggregatedGlobal.crit_res_down
                }
            });

            logs.push({
                unitName: member.unit.name,
                action: eq.name,
                damage: eqDmg
            });
            totalDamage += eqDmg;
        });
    });

    return { totalDamage, logs, finalPartyStats };
};
