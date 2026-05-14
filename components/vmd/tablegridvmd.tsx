"use client"

import React, { ReactNode } from 'react';

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '1rem 0',
  fontSize: '0.875rem',
  lineHeight: 1.42857,
};

const cellStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  textAlign: 'left',
  borderBottom: '1px solid var(--v0plex-border-subtle)',
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
  background: 'var(--v0plex-background-hover)',
};

// Tablegrid container - simple native HTML table, matching homepage style
export function Tablegridvmd({ children }: { children: ReactNode }) {
  return (
    <table style={tableStyle}>
      {children}
    </table>
  );
}

// Tablegrid head
export function Tablegridheadvmd({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

// Tablegrid body
export function Tablegridbodyvmd({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

// Tablegrid row
export function Tablegridrowvmd({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

// Tablegrid cell
interface TablegridcellvmdProps {
  children: ReactNode;
  header?: string;
  align?: 'left' | 'center' | 'right' | null;
}

export function Tablegridcellvmd({ children, header, align }: TablegridcellvmdProps) {
  const isHeader = header === 'true';
  const alignStyle: React.CSSProperties = align ? { textAlign: align } : {};

  if (isHeader) {
    return <th style={{ ...headerCellStyle, ...alignStyle }}>{children}</th>;
  }
  return <td style={{ ...cellStyle, ...alignStyle }}>{children}</td>;
}
