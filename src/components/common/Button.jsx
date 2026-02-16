import React from 'react';
import './Common.css';

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
    return (
        <button
            className={`custom-btn ${variant} ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
