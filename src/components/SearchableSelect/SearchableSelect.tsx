'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import styles from './SearchableSelect.module.css';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    emptyMessage?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = '-- เลือก --',
    disabled = false,
    required = false,
    emptyMessage = 'ไม่พบข้อมูล'
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchTerm('');
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${disabled ? styles.disabled : ''}`}
        >
            {/* Selected Value / Trigger */}
            <div
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={handleToggle}
            >
                <span className={value ? styles.value : styles.placeholder}>
                    {value || placeholder}
                </span>
                <div className={styles.actions}>
                    {value && !disabled && (
                        <button
                            type="button"
                            className={styles.clearBtn}
                            onClick={handleClear}
                            title="ล้างค่า"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        size={18}
                        className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className={styles.dropdown}>
                    {/* Search Input */}
                    <div className={styles.searchContainer}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className={styles.searchClear}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm('');
                                    inputRef.current?.focus();
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className={styles.optionsList}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    className={`${styles.option} ${value === option ? styles.selected : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <span>{option}</span>
                                    {value === option && <Check size={16} className={styles.checkIcon} />}
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyMessage}>
                                {emptyMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hidden input for form validation */}
            {required && (
                <input
                    type="text"
                    value={value}
                    onChange={() => { }}
                    required
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        pointerEvents: 'none',
                        width: 0,
                        height: 0
                    }}
                />
            )}
        </div>
    );
}
