import React, { useState, useRef, useEffect } from 'react';

/**
 * 検索機能（部分一致）を備えた選択コンポーネント
 * @param {Array} options - 選択肢の配列 [{id, name, ...}]
 * @param {Function} onSelect - 選択時のコールバック
 * @param {any} value - 現在選択されている項目のID
 * @param {string} placeholder - 未選択時の表示テキスト
 * @param {string} className - 追加のクラス名
 */
const SearchableSelect = ({ options, onSelect, value, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    // 選択済みの項目を取得
    const selectedItem = options.find(opt => opt.id === value);

    // 外部クリックで閉じる処理
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 検索フィルタリング（部分一致、大文字小文字区別なし）
    const filteredOptions = searchTerm.trim() === ""
        ? []
        : options.filter(opt =>
            opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleSelect = (item) => {
        onSelect(item);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`searchable-select ${className || ''}`} ref={wrapperRef}>
            <div className="searchable-select-trigger glass-input" onClick={() => setIsOpen(!isOpen)}>
                {selectedItem ? selectedItem.name : placeholder || "選択してください..."}
            </div>

            {isOpen && (
                <div className="searchable-select-dropdown glass-panel">
                    <input
                        type="text"
                        className="searchable-select-input glass-input"
                        placeholder="名前を入力..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking input
                        autoFocus
                    />
                    <div className="searchable-options-list">
                        {searchTerm.trim() === "" && (
                            <div
                                className="searchable-option-item clear-option"
                                onMouseDown={() => handleSelect(null)}
                            >
                                <div className="option-main-info">
                                    <span className="option-name">{placeholder || "スロット解除"}</span>
                                    <span className="option-badge clear">解除</span>
                                </div>
                            </div>
                        )}
                        {searchTerm.trim() === "" ? (
                            <div className="searchable-info-text">検索してください...</div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    className="searchable-option-item"
                                    onMouseDown={() => handleSelect(opt)}
                                >
                                    <div className="option-main-info">
                                        <span className="option-name">{opt.name}</span>
                                        <div className="option-badges">
                                            {opt.element && <span className="option-badge elem">{opt.element}</span>}
                                            {opt.category && <span className="option-badge cat">{opt.category}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="searchable-info-text">該当なし</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
