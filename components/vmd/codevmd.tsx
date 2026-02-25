"use client"

import React, {useEffect, useState} from 'react';
import CodeBlock from '../common/code-block';

interface CodeVmdProps {
    filePath: string;
    language?: string;
}

export function Inlinecodevmd({filePath}: CodeVmdProps) {
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filePath) return;
        fetch(`/vmdcode/${filePath}.txt`)
            .then(res => res.text())
            .then(text => {
                setCode(text);
                setLoading(false);
            })
            .catch(err => {
                // console.error("Failed to load inline code:", err);
                setCode("Error loading code");
                setLoading(false);
            });
    }, [filePath]);

    if (loading) return <code>...</code>;

    return <CodeBlock inline>{code}</CodeBlock>;
}

export function Blockcodevmd({filePath, language}: CodeVmdProps) {
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filePath) return;

        fetch(`/vmdcode/${filePath}.txt`)
            .then(res => res.text())
            .then(text => {
                setCode(text);
                setLoading(false);
            })
            .catch(err => {
                // console.error("Failed to load block code:", err);
                setCode("Error loading code");
                setLoading(false);
            });
    }, [filePath]);

    if (loading) return <div className="loading-code-block">Loading code...</div>;

    return <CodeBlock language={language}>{code}</CodeBlock>;
}