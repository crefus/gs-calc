import React from 'react';
import Input from '../common/Input';
import SliderInput from '../common/SliderInput';
import SearchableSelect from '../common/SearchableSelect';
import unitsData from '../../data/units.json';
import equipData from '../../data/equipment.json';
import crestData from '../../data/crests.json';
import './AutoMode.css';

const UnitSlot = ({ slotIndex, data, onUpdate, isLeader, onSetLeader, calculatedStats }) => {
    const { unit, equips, crests, selectedAction, equipEnabled, customStats, tasHP, tasAtk, tasDef, hpRate, equipTargetIndices } = data;
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Default values
    const action = selectedAction || 'trueArts';
    const eqEnabled = equipEnabled || [true, true, true];
    const tas_hp = tasHP !== undefined ? tasHP : 0;
    const tas_atk = tasAtk !== undefined ? tasAtk : 0;
    const tas_def = tasDef !== undefined ? tasDef : 0;
    const eqTargetIndices = equipTargetIndices || [0, 0, 0];
    const hp_rate = hpRate !== undefined ? hpRate : 1.0;

    // Stats calculation
    const stats = customStats || (unit ? { hp: unit.baseHp || 0, atk: unit.baseAtk || 0, def: unit.baseDef || 0 } : { hp: 0, atk: 0, def: 0 });

    const equipStatsSum = (equips || []).reduce((acc, eq) => {
        if (eq && eq.stats) {
            acc.hp += Number(eq.stats.hp || 0);
            acc.atk += Number(eq.stats.atk || 0);
            acc.def += Number(eq.stats.def || 0);
        }
        return acc;
    }, { hp: 0, atk: 0, def: 0 });

    const finalHP = Number(stats.hp) + Number(tas_hp) + equipStatsSum.hp;
    const finalAtk = Number(stats.atk) + Number(tas_atk) + equipStatsSum.atk;
    const finalDef = Number(stats.def) + Number(tas_def) + equipStatsSum.def;

    // Determine stats to display: use calculated true final stats if available, otherwise simple sum
    const displayHP = calculatedStats ? calculatedStats.hp : finalHP;
    const displayAtk = calculatedStats ? calculatedStats.atk : finalAtk;
    const displayDef = calculatedStats ? calculatedStats.def : finalDef;

    // Handlers
    const handleUnitSelection = (selectedUnit) => {
        onUpdate(slotIndex, {
            ...data,
            unit: selectedUnit,
            equips: [null, null, null],
            crests: [null, null, null],
            customStats: selectedUnit ? {
                hp: selectedUnit.baseHp || 0,
                atk: selectedUnit.baseAtk || 0,
                def: selectedUnit.baseDef || 0
            } : null,
            tasHP: 0,
            tasAtk: 0,
            tasDef: 0,
            hpRate: 1.0,
            equipTargetIndices: [0, 0, 0]
        });
    };

    const handleTasChange = (field, value) => {
        onUpdate(slotIndex, { ...data, [field]: value });
    };

    const handleHpRateChange = (e) => {
        const newVal = parseFloat(e.target.value);
        if (!isNaN(newVal)) onUpdate(slotIndex, { ...data, hpRate: newVal / 100 });
    };

    const handleCurrentHpChange = (e) => {
        const val = e.target.value;
        if (val === "") {
            onUpdate(slotIndex, { ...data, hpRate: 0 });
            return;
        }
        const numericVal = parseInt(val);
        if (isNaN(numericVal)) return;
        const newRate = finalHP > 0 ? Math.min(1, Math.max(0, numericVal / finalHP)) : 0;
        onUpdate(slotIndex, { ...data, hpRate: newRate });
    };

    const handleStatsChange = (field, value) => {
        onUpdate(slotIndex, {
            ...data,
            customStats: { ...stats, [field]: value }
        });
    };

    const handleEquipChange = (eqIndex, selectedEq) => {
        const newEquips = [...equips];
        newEquips[eqIndex] = selectedEq;
        const newTargets = [...eqTargetIndices];
        newTargets[eqIndex] = 0;
        onUpdate(slotIndex, { ...data, equips: newEquips, equipTargetIndices: newTargets });
    };

    const handleEquipTargetChange = (eqIndex, e) => {
        const targetIdx = parseInt(e.target.value);
        const newTargets = [...eqTargetIndices];
        newTargets[eqIndex] = targetIdx;
        onUpdate(slotIndex, { ...data, equipTargetIndices: newTargets });
    };

    const handleActionChange = (e) => {
        onUpdate(slotIndex, { ...data, selectedAction: e.target.value });
    };

    const handleEquipToggle = (eqIndex) => {
        const newEnabled = [...eqEnabled];
        newEnabled[eqIndex] = !newEnabled[eqIndex];
        onUpdate(slotIndex, { ...data, equipEnabled: newEnabled });
    };

    const handleCrestChange = (idx, selectedCrest) => {
        const newCrests = crests ? [...crests] : [null, null, null];
        newCrests[idx] = selectedCrest;
        onUpdate(slotIndex, { ...data, crests: newCrests });
    };

    const handleButtonToggle = (index = -1) => {
        if (!unit || !unit.button) return;
        let updatedButton;
        if (Array.isArray(unit.button)) {
            updatedButton = [...unit.button];
            updatedButton[index] = { ...updatedButton[index], value: !updatedButton[index].value };
        } else {
            updatedButton = { ...unit.button, value: !unit.button.value };
        }
        onUpdate(slotIndex, { ...data, unit: { ...unit, button: updatedButton } });
    };

    const handleEquipButtonToggle = (eqIndex, btnIndex = -1) => {
        const eq = equips[eqIndex];
        if (!eq || !eq.button) return;
        const newEquips = [...equips];
        let updatedButton;
        if (Array.isArray(eq.button)) {
            updatedButton = [...eq.button];
            updatedButton[btnIndex] = { ...updatedButton[btnIndex], value: !updatedButton[btnIndex].value };
        } else {
            updatedButton = { ...eq.button, value: !eq.button.value };
        }
        newEquips[eqIndex] = { ...eq, button: updatedButton };
        onUpdate(slotIndex, { ...data, equips: newEquips });
    };

    return (
        <div className={`unit-slot glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="slot-header">
                <div className="slot-header-left">
                    <button
                        className="collapse-toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "展開" : "折り畳む"}
                    >
                        {isCollapsed ? '▶' : '▼'}
                    </button>
                    <span className="slot-number">#{slotIndex + 1}</span>
                    <SearchableSelect
                        options={unitsData}
                        onSelect={handleUnitSelection}
                        value={unit ? unit.id : ""}
                        placeholder="ユニットを選択..."
                        className="unit-select"
                    />
                </div>
                <button
                    className={`leader-toggle ${isLeader ? 'active' : ''}`}
                    onClick={onSetLeader}
                    title="リーダーに設定"
                >
                    {isLeader ? '★ LEADER' : 'SET LEADER'}
                </button>
            </div>

            {!isCollapsed && (
                <div className="slot-details">
                    {!unit ? (
                        <div className="empty-unit-placeholder mini-text">
                            ユニットを選択してください
                        </div>
                    ) : (
                        <>
                            <div className="stats-section">
                                <Input label="HP" value={stats.hp} onChange={(e) => handleStatsChange('hp', e.target.value)} />
                                <Input label="攻撃力" value={stats.atk} onChange={(e) => handleStatsChange('atk', e.target.value)} />
                                <Input label="防御力" value={stats.def} onChange={(e) => handleStatsChange('def', e.target.value)} />
                                <div className="final-stats-display mini-text">
                                    最終: HP {displayHP.toLocaleString()} / ATK {displayAtk.toLocaleString()} / DEF {displayDef.toLocaleString()}
                                </div>
                            </div>

                            <div className="tas-section">
                                <label className="section-title">タス値</label>
                                <div className="stats-grid-mini">
                                    <Input label="HP" value={tas_hp} onChange={(e) => handleTasChange('tasHP', e.target.value)} />
                                    <Input label="攻撃力" value={tas_atk} onChange={(e) => handleTasChange('tasAtk', e.target.value)} />
                                    <Input label="防御力" value={tas_def} onChange={(e) => handleTasChange('tasDef', e.target.value)} />
                                </div>
                            </div>

                            <div className="hp-bar-section">
                                <SliderInput
                                    label="HPバー"
                                    value={Number((hp_rate * 100).toFixed(1))}
                                    onChange={handleHpRateChange}
                                    min={0} max={100} step={0.1} suffix="%"
                                />
                                <div className="current-hp-input-container">
                                    <label className="mini-text">現在HP:</label>
                                    <input
                                        type="number"
                                        className="glass-input mini-input"
                                        value={Math.floor(finalHP * hp_rate)}
                                        onChange={handleCurrentHpChange}
                                        min={0} max={finalHP}
                                    />
                                    <span className="mini-text"> / {finalHP.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="action-section">
                                <label>使用奥義</label>
                                <select className="glass-select" value={action} onChange={handleActionChange}>
                                    <option value="skill">スキル</option>
                                    <option value="arts">奥義</option>
                                    <option value="trueArts">真奥義</option>
                                    <option value="superArts">超奥義</option>
                                    <option value="phantomBullet">PB</option>
                                </select>
                                {unit.button && (
                                    <div className="unit-buttons-container">
                                        {(Array.isArray(unit.button) ? unit.button : [unit.button]).map((btn, idx) => (
                                            <div key={btn.id || idx} className="unit-button-toggle">
                                                <label className="glass-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={btn.value || false}
                                                        onChange={() => handleButtonToggle(Array.isArray(unit.button) ? idx : -1)}
                                                    />
                                                    <span>{btn.name}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {equips && equips.some(eq => eq && eq.button) && (
                                    <div className="equipment-buttons-container">
                                        {equips.map((eq, eqIdx) => {
                                            if (!eq || !eq.button) return null;
                                            const buttons = Array.isArray(eq.button) ? eq.button : [eq.button];
                                            return buttons.map((btn, btnIdx) => (
                                                <div key={`eq-${eqIdx}-btn-${btn.id || btnIdx}`} className="unit-button-toggle">
                                                    <label className="glass-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={btn.value || false}
                                                            onChange={() => handleEquipButtonToggle(eqIdx, Array.isArray(eq.button) ? btnIdx : -1)}
                                                        />
                                                        <span>{btn.name}</span>
                                                    </label>
                                                </div>
                                            ));
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="equip-section">
                                <label>装備</label>
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="equip-row">
                                        <input
                                            type="checkbox"
                                            checked={eqEnabled[i]}
                                            onChange={() => handleEquipToggle(i)}
                                            title="使用する"
                                        />
                                        <SearchableSelect
                                            options={equipData.filter(eq => {
                                                if (!unit || !unit.slots || !unit.slots[i]) return true;
                                                const slotOptions = Array.isArray(unit.slots[i]) ? unit.slots[i] : [unit.slots[i]];
                                                const parts = (eq.category || "0-").split('-');
                                                const eqLevel = parseInt(parts[0]);
                                                const eqCat = parts[1];
                                                return slotOptions.some(option => {
                                                    const sParts = option.split('-');
                                                    const slotLevel = parseInt(sParts[0]);
                                                    const slotCat = sParts[1];
                                                    return slotCat === eqCat && eqLevel <= slotLevel;
                                                });
                                            })}
                                            onSelect={(eq) => handleEquipChange(i, eq)}
                                            value={equips[i] ? equips[i].id : ""}
                                            placeholder="無し"
                                            className="equip-select"
                                        />
                                        <div className="slot-info-label mini-text">
                                            {unit && unit.slots && unit.slots[i] ? (
                                                Array.isArray(unit.slots[i])
                                                    ? unit.slots[i].map(s => s.split('-')[1]).join('/') + ' Lv.' + unit.slots[i][0].split('-')[0]
                                                    : unit.slots[i].split('-')[1] + ' Lv.' + unit.slots[i].split('-')[0]
                                            ) : ''}
                                        </div>
                                        {equips[i] && (
                                            <div className="equip-target-indicator">
                                                {equips[i].buffs && equips[i].buffs.some(b => b.target === 'select') ? (
                                                    <select
                                                        className="mini-select target-select"
                                                        value={eqTargetIndices[i]}
                                                        onChange={(e) => handleEquipTargetChange(i, e)}
                                                        title="バフ対象を選択"
                                                    >
                                                        <option value={0}>味方1</option>
                                                        <option value={1}>味方2</option>
                                                        <option value={2}>味方3</option>
                                                        <option value={3}>味方4</option>
                                                    </select>
                                                ) : (
                                                    <span className="mini-text buff-target-label">
                                                        {equips[i].buffs && equips[i].buffs.length > 0 ? (
                                                            equips[i].buffs[0].target === 'party' ? '全体' :
                                                                equips[i].buffs[0].target === 'enemy' ? '敵' : '自身'
                                                        ) : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="crest-section">
                                <label>紋章石</label>
                                {[0, 1, 2].map(i => (
                                    <SearchableSelect
                                        key={i}
                                        options={crestData}
                                        onSelect={(crest) => handleCrestChange(i, crest)}
                                        value={crests && crests[i] ? crests[i].id : ""}
                                        placeholder={`スロット ${i + 1}`}
                                        className="crest-select"
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default UnitSlot;
