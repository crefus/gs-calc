import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import SliderInput from '../common/SliderInput';
import { calculateHit } from '../../utils/calculation';
import './ManualCalculator.css';

const ManualCalculator = () => {
    const [params, setParams] = useState({
        unitAtk: 3000,
        skillMulti: 25000,
        enemyDef: 1500,
        defIgnore: 0,
        totalDmgUp: 50,
        enemyDmgTaken: 0,
        critRate: 100, // Changed: % chance
        superCritRate: 0,
        elemAdvantage: 1.0,
        isBreak: false
    });

    const [result, setResult] = useState(0);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => {
        setParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleToggle = (field) => {
        setParams(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    useEffect(() => {
        // Validation
        const requiredFields = ['unitAtk', 'skillMulti', 'enemyDef'];
        const missing = requiredFields.filter(f => params[f] === "" || params[f] === undefined);

        if (missing.length > 0) {
            setError("必須項目を入力してください（攻撃力、倍率、敵防御力）");
            setResult(0);
            return;
        }

        setError(null);
        // Parse all params before calculation
        const numericParams = {};
        Object.keys(params).forEach(key => {
            numericParams[key] = typeof params[key] === 'boolean' ? params[key] : parseFloat(params[key]) || 0;
        });

        const dmg = calculateHit(numericParams);
        setResult(dmg);
    }, [params]);

    return (
        <div className="manual-calc-container">
            <div className="params-grid">
                <div className="glass-panel p-lg">
                    <h3 className="section-title">攻撃側ステータス</h3>
                    <Input
                        label="合計攻撃力"
                        value={params.unitAtk}
                        onChange={(e) => handleChange('unitAtk', e.target.value)}
                    />
                    <Input
                        label="スキル倍率 (%)"
                        value={params.skillMulti}
                        onChange={(e) => handleChange('skillMulti', e.target.value)}
                        suffix="%"
                    />
                    <Input
                        label="与ダメージUP合計 (%)"
                        value={params.totalDmgUp}
                        onChange={(e) => handleChange('totalDmgUp', e.target.value)}
                        suffix="%"
                    />
                    <Input
                        label="被ダメージUP (敵デバフ) (%)"
                        value={params.enemyDmgTaken}
                        onChange={(e) => handleChange('enemyDmgTaken', e.target.value)}
                        suffix="%"
                    />
                    <div className="input-group-stack">
                        <SliderInput
                            label="クリティカル率"
                            value={params.critRate}
                            onChange={(e) => handleChange('critRate', e.target.value)}
                        />
                        <SliderInput
                            label="スーパークリティカル率"
                            value={params.superCritRate}
                            onChange={(e) => handleChange('superCritRate', e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-panel p-lg">
                    <h3 className="section-title">敵・その他補正</h3>
                    <Input
                        label="敵防御力"
                        value={params.enemyDef}
                        onChange={(e) => handleChange('enemyDef', e.target.value)}
                    />
                    <SliderInput
                        label="防御無視率"
                        value={params.defIgnore}
                        onChange={(e) => handleChange('defIgnore', e.target.value)}
                    />

                    <div className="toggles">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={params.isBreak}
                                onChange={() => handleToggle('isBreak')}
                            />
                            ブレイク中
                        </label>
                    </div>

                    <div className="element-select">
                        <label>属性相性</label>
                        <select
                            value={params.elemAdvantage}
                            onChange={(e) => handleChange('elemAdvantage', e.target.value)}
                            className="glass-select"
                        >
                            <option value={1.2}>有利 (1.2倍)</option>
                            <option value={1.0}>等倍 (1.0倍)</option>
                            <option value={0.8}>不利 (0.8倍)</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="calc-error-message glass-panel">
                    ⚠️ {error}
                </div>
            )}

            <div className="results-panel glass-panel">
                <h2 className="results-title">計算結果</h2>
                <div className="damage-display">
                    <span className="damage-label">期待ダメージ:</span>
                    <span className="damage-value text-gradient-gold">{result.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default ManualCalculator;
