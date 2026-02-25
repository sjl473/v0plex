"use client"

import React, {useEffect, useRef} from 'react';
import {useMathJax} from '@/components/common/mathjax-provider';

interface MathProps {
    formula: string;
}

export function Inlinemathvmd({formula}: MathProps) {
    const {typeset} = useMathJax();
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (ref.current) {
            typeset(ref.current);
        }
    }, [formula, typeset]);

    return <span ref={ref}>${formula}$</span>;
}

export function Blockmathvmd({formula}: MathProps) {
    const {typeset} = useMathJax();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            typeset(ref.current);
        }
    }, [formula, typeset]);

    return <div ref={ref}>$${formula}$$</div>;
}