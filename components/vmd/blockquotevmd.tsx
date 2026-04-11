"use client"

import React from 'react';
import styles from './blockquote.module.css';
import {useVmdColorIndex} from './vmd-theme-context';

export function Blockquotevmd({children}: { children: React.ReactNode }) {
    const colorIndex = useVmdColorIndex();
    const colorClass = styles[`color${colorIndex}`];

    return (<div className={`${styles.blockquote} ${colorClass}`}>
            {children}
        </div>);
}