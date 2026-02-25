import NextLink from 'next/link';
import React, {ReactNode} from 'react';
import {useTheme} from "@/components/common/theme-provider";
import styles from "./link.module.css";

interface LinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    isDark?: boolean;
    style?: React.CSSProperties;
}

export default function Link({
                                 href, children, className, target, rel, disabled = false, isDark, style, ...props
                             }: LinkProps) {
    const {theme} = useTheme();

    const effectiveTheme = isDark !== undefined ? (isDark ? 'g100' : 'white') : theme;

    const linkClassName = `${styles.link} ${effectiveTheme === 'g100' ? styles.darkTheme : styles.lightTheme} ${disabled ? styles.disabled : ''} ${className || ''}`;

    const combinedStyle = {
        ...style
    };

    // Safe check for href
    const safeHref = href || '';
    const isExternal = safeHref.startsWith('http');

    if (disabled || !href) {
        return (<span
            className={linkClassName}
            style={combinedStyle}
            {...props}
        >
        {children}
      </span>);
    }

    if (isExternal) {
        return (<a href={safeHref}
                   className={linkClassName}
                   style={combinedStyle}
                   target={target || '_blank'}
                   rel={rel || 'noopener noreferrer'}
                   {...props}
        >
            {children}
        </a>);
    }

    return (<NextLink
        href={safeHref}
        className={linkClassName}
        style={combinedStyle}
        target={target}
        rel={rel}
        {...props}
    >
        {children}
    </NextLink>);
}