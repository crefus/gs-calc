import React from 'react';
import './SliderInput.css';

const SliderInput = ({ label, value, onChange, min = 0, max = 100, step = 1, suffix = '%' }) => {

    const handleSliderChange = (e) => {
        onChange(e);
    };

    const handleNumberChange = (e) => {
        let val = e.target.value;
        if (val !== "") {
            let newVal = parseFloat(val);
            if (newVal > max) val = max.toString();
        }

        // Maintain string while typing, parse during calc if needed
        onChange({ target: { value: val } });
    };

    return (
        <div className="slider-input-container">
            <div className="slider-header">
                <label className="slider-label">{label}</label>
                <div className="slider-value-display">
                    {Number(value).toFixed(1)}{suffix}
                </div>
            </div>
            <div className="slider-controls">
                <input
                    type="range"
                    className="slider-range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleSliderChange}
                />
                {/* Optional: Provide direct number input for precise values if slider is hard to control */}
                {/* For now, just the slider + display as requested, but keeping an input is usually better UX */}
                {/* User asked for "slide bar format", but usually precise input is needed too. I will add a small input box next to it. */}
                <input
                    type="number"
                    className="slider-number-input"
                    value={value}
                    onChange={handleNumberChange}
                    min={min}
                    max={max}
                />
            </div>
        </div>
    );
};

export default SliderInput;
