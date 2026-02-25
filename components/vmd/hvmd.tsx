"use client"

import React from 'react';
import styles from './hvmd.module.css';
import {useVmdColorIndex} from './vmd-theme-context';

interface HeaderProps {
    children: React.ReactNode;
    id?: string;
}

const Header = ({tag: Tag, children, id}: HeaderProps & { tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) => {
    const colorIndex = useVmdColorIndex();
    const colorClass = styles[`headerColor${colorIndex}`];

    return (
        <Tag id={id} className={`${styles.header} ${colorClass} ${styles[Tag]}`}>
            {children}
        </Tag>
    );
};

export function H1vmd(props: HeaderProps) {
    return <Header tag="h1" {...props} />;
}

export function H2vmd(props: HeaderProps) {
    return <Header tag="h2" {...props} />;
}

export function H3vmd(props: HeaderProps) {
    return <Header tag="h3" {...props} />;
}

export function H4vmd(props: HeaderProps) {
    return <Header tag="h4" {...props} />;
}

export function H5vmd(props: HeaderProps) {
    return <Header tag="h5" {...props} />;
}

export function H6vmd(props: HeaderProps) {
    return <Header tag="h6" {...props} />;
}