"use client";

import React, { useState, Children, ReactElement, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CaretLeft, CaretRight, ZoomOut } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import styles from './postvmd.module.css';
import { Pvmd } from './pvmd';
import {useLanguage} from '@/components/common/language-provider';

export function Postvmd({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            {children}
        </div>
    );
}

export function Lftvmd({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.leftColumn}>
            {children}
        </div>
    );
}

interface ImageProps {
    src: string;
    alt: string;
    title?: string;
}

export function Rtvmd({ children }: { children: React.ReactNode }) {
    const {strings} = useLanguage();
    // Extract image data from children
    const images: ImageProps[] = [];

    Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
            const props = child.props as ImageProps;
            if (props.src) {
                images.push({
                    src: props.src,
                    alt: props.alt || '',
                    title: props.title
                });
            }
        }
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [useVerticalNav, setUseVerticalNav] = useState(false);
    const imageWrapperRef = useRef<HTMLDivElement>(null);

    // Check if we need to use vertical navigation based on container width
    useEffect(() => {
        const checkWidth = () => {
            if (imageWrapperRef.current) {
                const width = imageWrapperRef.current.offsetWidth;
                // If container is less than 120px (roughly 2 * 3rem arrow width + margins), use vertical nav
                setUseVerticalNav(width < 120);
            }
        };

        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);

    if (images.length === 0) {
        return <div className={styles.rightColumn}>No images found</div>;
    }

    const currentImage = images[currentIndex];
    const hasMultiple = images.length > 1;
    const counterText = `${currentIndex + 1}/${images.length}`;

    const prevImage = useCallback((e?: any) => {
        e?.stopPropagation?.();
        if (hasMultiple) {
            setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        }
    }, [hasMultiple, images.length]);

    const nextImage = useCallback((e?: any) => {
        e?.stopPropagation?.();
        if (hasMultiple) {
            setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }
    }, [hasMultiple, images.length]);

    const openModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsModalOpen(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    const closeModal = useCallback((e?: any) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setIsModalOpen(false);
        // Restore body scroll
        document.body.style.overflow = '';
    }, []);

    useEffect(() => {
        setMounted(true);

        // Add keyboard navigation support for modal
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isModalOpen) return;

            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, prevImage, nextImage, closeModal]);

    const Modal = () => {
        if (!isModalOpen || !mounted) return null;

        return createPortal(
            <div className={styles.modalOverlay} onClick={closeModal}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <Button className={styles.modalCloseBtn} onClick={closeModal} kind="ghost" size="lg">
                        <ZoomOut size={32} />
                    </Button>
                    
                    {hasMultiple && (
                        <Button className={`${styles.modalNavBtn} ${styles.modalPrev}`} onClick={prevImage} kind="ghost" size="lg">
                            <CaretLeft size={32} />
                        </Button>
                    )}

                    <img
                        src={currentImage.src}
                        alt={currentImage.alt}
                        className={styles.modalImage}
                    />

                    {hasMultiple && (
                        <Button className={`${styles.modalNavBtn} ${styles.modalNext}`} onClick={nextImage} kind="ghost" size="lg">
                            <CaretRight size={32} />
                        </Button>
                    )}
                    
                    <div className={styles.modalCaption}>
                        {hasMultiple && <span className={styles.modalCounter}>{counterText}</span>}
                        <div style={{ color: '#fff' }}>
                            {currentImage.title || currentImage.alt}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={styles.rightColumn}>
            <div className={styles.imageWrapper} ref={imageWrapperRef}>
                <img
                    src={currentImage.src}
                    alt={currentImage.alt}
                    className={styles.activeImage}
                    onClick={openModal}
                    style={{ cursor: 'pointer' }}
                />

                {/* Image Counter */}
                {hasMultiple && (
                    <div className={styles.imageCounter}>
                        {counterText}
                    </div>
                )}

                {/* Zoom Logo REMOVED as requested */}

                {hasMultiple && (
                    <>
                        {useVerticalNav ? (
                            <>
                                <div className={`${styles.navArrow} ${styles.navArrowUp}`} onClick={prevImage} />
                                <div className={`${styles.navArrow} ${styles.navArrowDown}`} onClick={nextImage} />
                            </>
                        ) : (
                            <>
                                <div className={`${styles.navArrow} ${styles.navArrowLeft}`} onClick={prevImage} />
                                <div className={`${styles.navArrow} ${styles.navArrowRight}`} onClick={nextImage} />
                            </>
                        )}
                    </>
                )}
            </div>

            <div className={styles.caption}>
                <Pvmd>
                    {currentImage.title || currentImage.alt}
                </Pvmd>
            </div>

            <Modal />
        </div>
    );
}
