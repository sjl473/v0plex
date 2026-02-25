import React, { ReactNode } from 'react';

interface PvmdProps {
    children: ReactNode;
}

export function Pvmd({ children }: PvmdProps) {
    return <p>{children}</p>;
}