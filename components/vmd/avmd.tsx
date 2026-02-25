import React, {ReactNode} from 'react';
import Link from '../common/link';

interface AvmdProps {
    href: string;
    children: ReactNode;
    title?: string;
}

export function Avmd({href, children, title}: AvmdProps) {
    const extraProps = title ? {title} : {};

    return (<Link href={href} {...extraProps}>
            {children}
        </Link>);
}