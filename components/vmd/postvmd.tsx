"use client";

import React, { useState, Children, ReactElement, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CaretLeft, CaretRight, CaretUp, CaretDown, Close, ZoomIn, ZoomOut, Reset } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import styles from './postvmd.module.css';
import { Pvmd } from './pvmd';
import {useLanguage} from '@/components/common/language-provider';

// Utility to lock/unlock body scroll on mobile (iOS Safari compatible)
function lockBodyScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return scrollY;
}

function unlockBodyScroll(scrollY: number) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    window.scrollTo(0, scrollY);
}

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
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageWrapperRef = useRef<HTMLDivElement>(null);
    const scrollYRef = useRef(0);

    const handleZoomIn = useCallback((e?: any) => {
        e?.stopPropagation?.();
        setZoom(prev => Math.min(prev + 0.5, 4));
    }, []);

    const handleZoomOut = useCallback((e?: any) => {
        e?.stopPropagation?.();
        setZoom(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) setOffset({ x: 0, y: 0 });
            return newZoom;
        });
    }, []);

    const handleResetZoom = useCallback((e?: any) => {
        e?.stopPropagation?.();
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isModalOpen) return;
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

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
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    }, [hasMultiple, images.length]);

    const nextImage = useCallback((e?: any) => {
        e?.stopPropagation?.();
        if (hasMultiple) {
            setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    }, [hasMultiple, images.length]);

    const openModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        scrollYRef.current = lockBodyScroll();
        setIsModalOpen(true);
    };

    const closeModal = useCallback((e?: any) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setIsModalOpen(false);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        unlockBodyScroll(scrollYRef.current);
    }, []);

    useEffect(() => {
        setMounted(true);

        // Preload next and previous images
        if (hasMultiple) {
            const nextIdx = (currentIndex + 1) % images.length;
            const prevIdx = (currentIndex - 1 + images.length) % images.length;
            
            const imgNext = new Image();
            imgNext.src = images[nextIdx].src;
            
            const imgPrev = new Image();
            imgPrev.src = images[prevIdx].src;
        }

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
    }, [isModalOpen, prevImage, nextImage, closeModal, currentIndex, images, hasMultiple]);

    return (
        <div className={styles.rightColumn}>
            <div className={styles.imageWrapper} ref={imageWrapperRef}>
                <img
                    src={currentImage.src}
                    alt={currentImage.alt}
                    className={styles.activeImage}
                    onClick={openModal}
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
                                <div className={`${styles.navArrow} ${styles.navArrowUp}`} onClick={prevImage}>
                                    <CaretUp size={24} />
                                </div>
                                <div className={`${styles.navArrow} ${styles.navArrowDown}`} onClick={nextImage}>
                                    <CaretDown size={24} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`${styles.navArrow} ${styles.navArrowLeft}`} onClick={prevImage}>
                                    <CaretLeft size={24} />
                                </div>
                                <div className={`${styles.navArrow} ${styles.navArrowRight}`} onClick={nextImage}>
                                    <CaretRight size={24} />
                                </div>
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

            {isModalOpen && mounted && createPortal(
                <div className={styles.modalOverlay} onClick={closeModal} onWheel={handleWheel}>
                    <div className={styles.modalToolbar}>
                        <Button className={styles.modalToolbarBtn} onClick={handleZoomIn} kind="ghost" size="lg" title="Zoom In">
                            <ZoomIn size={24} />
                        </Button>
                        <Button className={styles.modalToolbarBtn} onClick={handleZoomOut} kind="ghost" size="lg" title="Zoom Out">
                            <ZoomOut size={24} />
                        </Button>
                        <Button className={styles.modalToolbarBtn} onClick={handleResetZoom} kind="ghost" size="lg" title="Reset Zoom">
                            <Reset size={24} />
                        </Button>
                        <Button className={`${styles.modalToolbarBtn} ${styles.modalCloseBtn}`} onClick={closeModal} kind="ghost" size="lg" title="Close">
                            <Close size={24} />
                        </Button>
                    </div>

                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        
                        {hasMultiple && (
                            <Button className={`${styles.modalNavBtn} ${styles.modalPrev}`} onClick={prevImage} kind="ghost" size="lg">
                                <CaretLeft size={32} />
                            </Button>
                        )}

                        <img
                            src={currentImage.src}
                            alt={currentImage.alt}
                            className={styles.modalImage}
                            style={{ 
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDoubleClick={handleResetZoom}
                            draggable={false}
                        />

                        {hasMultiple && (
                            <Button className={`${styles.modalNavBtn} ${styles.modalNext}`} onClick={nextImage} kind="ghost" size="lg">
                                <CaretRight size={32} />
                            </Button>
                        )}
                        
                        <div className={styles.modalCaption}>
                            {hasMultiple && <span className={styles.modalCounter}>{counterText}</span>}
                            <div className={styles.modalCaptionText}>
                                {currentImage.title || currentImage.alt}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
