"use client"

import React from 'react';
import styles from './hvmd.module.css';
import { SquareOutline } from '@carbon/icons-react';

interface HeaderProps {
    children: React.ReactNode;
    id?: string;
}

const H1Header = ({ children, id }: HeaderProps) => {
    return (
        <h1 id={id} className={`${styles.header} ${styles.h1}`}>
            {children}
        </h1>
    );
};

export function H1vmd(props: HeaderProps) {
    return <H1Header {...props} />;
}

const Icon = () => (
    <span className={styles.sectionIcon}>
        <SquareOutline className={styles.anchorIcon} />
    </span>
);

const H2 = ({ children, id }: HeaderProps) => (
    <h2 id={id} className={`${styles.header} ${styles.h2}`}><Icon />{children}</h2>
);
const H3 = ({ children, id }: HeaderProps) => (
    <h3 id={id} className={`${styles.header} ${styles.h3}`}><Icon />{children}</h3>
);
const H4 = ({ children, id }: HeaderProps) => (
    <h4 id={id} className={`${styles.header} ${styles.h4}`}><Icon />{children}</h4>
);
const H5 = ({ children, id }: HeaderProps) => (
    <h5 id={id} className={`${styles.header} ${styles.h5}`}><Icon />{children}</h5>
);
const H6 = ({ children, id }: HeaderProps) => (
    <h6 id={id} className={`${styles.header} ${styles.h6}`}><Icon />{children}</h6>
);

export const H2vmd = H2, H3vmd = H3, H4vmd = H4, H5vmd = H5, H6vmd = H6;
