"use client"

import React from 'react';
import ResponsiveImage from '@/components/common/responsive-img';

interface ImgvmdProps {
    src: string;
    alt: string;
    title?: string;
}

export function Imgvmd({src, alt, title}: ImgvmdProps) {
    return (
        <ResponsiveImage
            src={src}
            alt={alt}
            caption={title}
            aspectRatio="16:9"
        />
    );
}