"use client"

import React from "react";
import {HighlightBox} from "@/components/common/highlight-box";

interface WrapperProps {
    children: React.ReactNode;
}

const validateSingleParagraph = (children: React.ReactNode, componentName: string) => {
    const validChildren = React.Children.toArray(children).filter(child => {
        return typeof child !== 'string' || child.trim().length > 0;
    });

    if (validChildren.length !== 1) {
        // console.warn(`[${componentName}] Warning: Expected exactly one child element (Pvmd), but received ${validChildren.length}.`);
        return;
    }

    const child = validChildren[0];
    if (React.isValidElement(child)) {
        const typeName = typeof child.type === 'string' ? child.type : (child.type as any).displayName || (child.type as any).name;

        if (typeName !== 'Pvmd') {
            // console.warn(`[${componentName}] Warning: Expected child to be <Pvmd>, but received <${typeName}>.`);
        }
    }
};


export function Titlevmd({children}: WrapperProps) {
    return <>{children}</>;
}

export function Contentvmd({children}: WrapperProps) {
    return <>{children}</>;
}

interface BoxVmdProps {
    children: React.ReactNode;
    title?: string;
}

export function Infovmd({children, title = "Notice："}: BoxVmdProps) {
    validateSingleParagraph(children, 'Infovmd');
    return <HighlightBox title={title} type="Info">{children}</HighlightBox>;
}

export function Warningvmd({children, title = "Warning"}: BoxVmdProps) {
    validateSingleParagraph(children, 'Warningvmd');
    return <HighlightBox title={title} type="Warning">{children}</HighlightBox>;
}

export function Successvmd({children, title = "Success"}: BoxVmdProps) {
    validateSingleParagraph(children, 'Successvmd');
    return <HighlightBox title={title} type="Success">{children}</HighlightBox>;
}