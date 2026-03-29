"use client"

import React, {useEffect, useState} from 'react';
import CodeBlock from '../common/code-block';
import {useLanguage} from '@/components/common/language-provider';
import {SITE_CONFIG} from '@/config/site.config';

interface CodeVmdProps {
    filePath: string;
    language?: string;
}

export function Inlinecodevmd({filePath}: CodeVmdProps) {
    const {strings} = useLanguage();
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filePath) return;
        fetch(`${SITE_CONFIG.DATA_PATHS.VMD_CODE}${filePath}.txt`)
            .then(res => res.text())
            .then(text => {
                setCode(text);
                setLoading(false);
            })
            .catch(err => {
                // console.error("Failed to load inline code:", err);
                setCode(strings.code.error);
                setLoading(false);
            });
    }, [filePath, strings.code.error]);

    if (loading) return <code>...</code>;

    return <CodeBlock inline>{code}</CodeBlock>;
}

export function Blockcodevmd({filePath, language}: CodeVmdProps) {
    const {strings} = useLanguage();
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filePath) return;

        fetch(`${SITE_CONFIG.DATA_PATHS.VMD_CODE}${filePath}.txt`)
            .then(res => res.text())
            .then(text => {
                setCode(text);
                setLoading(false);
            })
            .catch(err => {
                // console.error("Failed to load block code:", err);
                setCode(strings.code.error);
                setLoading(false);
            });
    }, [filePath, strings.code.error]);

    if (loading) return <div className="loading-code-block">{strings.code.loading}</div>;

    return <CodeBlock language={language}>{code}</CodeBlock>;
}