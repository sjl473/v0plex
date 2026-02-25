"use client"

import React from 'react';

interface SmallimgvmdProps {
    src: string;
    alt?: string;
}

export function Smallimgvmd({ src, alt }: SmallimgvmdProps) {
    return (
        <img
            src={src}
            alt={alt || ""}
            style={{
                height: "1.2em",
                width: "auto",
                display: "inline-block",
                verticalAlign: "text-bottom",
                margin: "0 2px"
            }}
        />
    );
}