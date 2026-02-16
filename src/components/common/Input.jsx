import React from 'react';
import './Common.css';

const Input = ({ label, value, onChange, type = "number", placeholder, suffix }) => {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <div className="input-wrapper glass-panel">
                <input
                    className="custom-input"
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                />
                {suffix && <span className="input-suffix">{suffix}</span>}
            </div>
        </div>
    );
};

export default Input;
