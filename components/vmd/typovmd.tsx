"use client"

import React from 'react';

// Removed ColoredSpan usage to prevent colorful text in bold/italic elements

export function Boldvmd({ children }: { children: React.ReactNode }) {
    return (
        <strong className="font-bold">
            {children}
        </strong>
    );
}

export function Italicvmd({ children }: { children: React.ReactNode }) {
    return (
        <em className="italic">
            {children}
        </em>
    );
}

export function Bolditvmd({ children }: { children: React.ReactNode }) {
    return (
        <strong className="font-bold italic">
            <em>{children}</em>
        </strong>
    );
}

export function Strikevmd({ children }: { children: React.ReactNode }) {
    return <del>{children}</del>;
}

export function Brvmd() {
    return <br />;
}