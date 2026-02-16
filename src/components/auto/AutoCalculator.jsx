import React, { useState, useEffect } from 'react';
import UnitSlot from './UnitSlot';
import Button from '../common/Button';
import { calculatePartyOutputs } from '../../utils/calculation';
import { encodePartyState, decodePartyState } from '../../utils/urlHelper';
import unitsData from '../../data/units.json';
import equipData from '../../data/equipment.json';
import crestData from '../../data/crests.json';
import './AutoMode.css';

const AutoCalculator = () => {
    // Party of 4 slots
    const [party, setParty] = useState(
        Array(4).fill(null).map((_, i) => ({
            unit: null,
            equips: [null, null, null],
            equipTargetIndices: [0, 0, 0], // Default all to slot 1
            crests: [null, null, null],
            isLeader: i === 0 // Default first slot as leader
        }))
    );

    const [leaderIndex, setLeaderIndex] = useState(0);

    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const updateSlot = (index, newData) => {
        const newParty = [...party];
        newParty[index] = newData;
        setParty(newParty);
    };

    const handleSetLeader = (index) => {
        setLeaderIndex(index);
        const newParty = party.map((slot, i) => ({
            ...slot,
            isLeader: i === index
        }));
        setParty(newParty);
    };

    useEffect(() => {
        // Load state from URL if present
        const params = new URLSearchParams(window.location.search);
        const pParam = params.get('p');
        if (pParam) {
            const decoded = decodePartyState(pParam, unitsData, equipData, crestData);
            if (decoded) {
                setParty(decoded);
                // Auto calculate? Maybe not to avoid lag.
            }
        }
    }, []);

    const [calculatedStats, setCalculatedStats] = useState(null);

    // Debounced calculation for realtime stats display
    useEffect(() => {
        const timer = setTimeout(() => {
            // Mock Enemy Stats for display calculation
            const displayEnemyStats = {
                def: 0, // Assume 0 def for stat check to see raw power, or standard 2000?
                // Actually, for "Status" display, we usually want the stats before enemy reduction?
                // calculatePartyOutputs returns 'finalStats' in pass 2 which are the unit's actual stats after buffs.
                // It does NOT depend on enemy stats for the ATK/DEF/HP values themselves, only for damage.
                resists: { physical: 0, magic: 0, elements: {} }
            };

            try {
                // We use a safe version of calculation that doesn't crash on incomplete data
                const output = calculatePartyOutputs(party, displayEnemyStats);
                if (output && output.finalPartyStats) {
                    setCalculatedStats(output.finalPartyStats);
                }
            } catch (e) {
                console.error("Auto calc failed:", e);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [party]);

    const handleShare = () => {
        const encoded = encodePartyState(party);
        const newUrl = `${window.location.pathname}?p=${encoded}`;
        window.history.pushState({}, '', newUrl);
        navigator.clipboard.writeText(window.location.href);
        alert("URLをクリップボードにコピーしました！");
    };

    const handleCalculate = () => {
        // Validation
        const invalidSlots = party.filter(slot => {
            if (!slot.unit) return false;
            const stats = slot.customStats || {};
            // Allow 0 but not empty string
            return stats.hp === "" || stats.atk === "" || stats.def === "";
        });

        if (invalidSlots.length > 0) {
            setError("ステータスが未入力のユニットがあります。数値を入力してください。");
            setResults(null);
            return;
        }

        setError(null);
        // Mock Enemy Stats for damage calc
        const enemyStats = {
            def: 2000,
            element: 'Neutral',
            race: 'God',
            resists: { physical: 0, magic: 0, elements: {} }
        };

        const output = calculatePartyOutputs(party, enemyStats);
        setResults(output);
    };

    return (
        <div className="auto-calc-container">
            <div className="party-grid">
                {party.map((slotData, index) => (
                    <UnitSlot
                        key={index}
                        slotIndex={index}
                        data={slotData}
                        onUpdate={updateSlot}
                        isLeader={index === leaderIndex}
                        onSetLeader={() => handleSetLeader(index)}
                        calculatedStats={calculatedStats ? calculatedStats[index] : null}
                    />
                ))}
            </div>

            {error && (
                <div className="calc-error-message glass-panel" style={{ marginTop: '20px' }}>
                    ⚠️ {error}
                </div>
            )}

            {results && (
                <div className="results-panel glass-panel">
                    <h3 className="text-gradient-gold">合計パーティーダメージ: {results.totalDamage.toLocaleString()}</h3>
                    <div className="logs-list">
                        {results.logs.map((log, i) => (
                            <div key={i} className="log-item">
                                <span className="log-unit">{log.unitName}</span>
                                <span className="log-action">{log.action === "True Arts" ? "真奥義" : log.action}</span>
                                <span className="log-dmg">{log.damage.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="actions-bar flex-center" style={{ gap: '16px' }}>
                <Button onClick={handleCalculate} className="calc-btn primary">
                    パーティーダメージ計算
                </Button>
                <Button onClick={handleShare} className="secondary">
                    編成を共有
                </Button>
            </div>
        </div>
    );
};

export default AutoCalculator;
