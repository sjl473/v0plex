// Type declarations for CSS files
declare module '*.css' {
    const content: { [className: string]: string }
    export default content
}

// Allow side-effect imports for global CSS files
declare module '*.css';
