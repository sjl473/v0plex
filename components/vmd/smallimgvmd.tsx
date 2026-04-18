"use client"

import React from 'react';
import styles from './smallimgvmd.module.css';

interface SmallimgvmdProps {
    src: string;
    alt?: string;
}

export function Smallimgvmd({ src, alt }: SmallimgvmdProps) {
    return (
        <img
            src={src}
            alt={alt || ""}
            className={styles.smallImage}
        />
    );
}