"use client"

import React from 'react';
import styles from './blockquote.module.css';
import headerStyles from './hvmd.module.css'; // Reuse color classes
import {useVmdColorIndex} from './vmd-theme-context';

export function Blockquotevmd({children}: { children: React.ReactNode }) {
    const colorIndex = useVmdColorIndex();
    const colorClass = headerStyles[`headerColor${colorIndex}`];

    return (<div className={`${styles.blockquote} ${colorClass}`}>
            {children}
        </div>);
}