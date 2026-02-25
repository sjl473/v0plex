"use client";

import React, { useState, Children, ReactElement, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ZoomOut } from '@carbon/icons-react'; // Removed ZoomIn import
import styles from './postvmd.module.css';
import { Pvmd } from './pvmd';

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
                    <button className={styles.modalCloseBtn} onClick={closeModal} title="Zoom back">
                        <ZoomOut size={32} />
                    </button>
                    
                    {hasMultiple && (
                        <button className={`${styles.modalNavBtn} ${styles.modalPrev}`} onClick={prevImage} title="Previous image">
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    <img
                        src={currentImage.src}
                        alt={currentImage.alt}
                        className={styles.modalImage}
                    />

                    {hasMultiple && (
                        <button className={`${styles.modalNavBtn} ${styles.modalNext}`} onClick={nextImage} title="Next image">
                            <ChevronRight size={32} />
                        </button>
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
            <div className={styles.imageWrapper}>
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
                        <div className={`${styles.navOverlay} ${styles.navLeft}`} onClick={prevImage} title="Previous">
                            <ChevronLeft className={styles.arrow} />
                        </div>
                        <div className={`${styles.navOverlay} ${styles.navRight}`} onClick={nextImage} title="Next">
                            <ChevronRight className={styles.arrow} />
                        </div>
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