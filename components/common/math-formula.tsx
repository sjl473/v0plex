"use client"

import {useEffect, useRef} from "react"
import {useMathJax} from "./mathjax-provider"
import styles from "./math-formula.module.css"

interface SimpleMathFormulaProps {
    formula: string
    display?: boolean
    inline?: boolean
}

export default function MathFormula({formula, display = false, inline = false}: SimpleMathFormulaProps) {
    const mathRef = useRef<HTMLSpanElement>(null)
    const {isLoaded, typeset} = useMathJax()

    useEffect(() => {
        if (isLoaded && mathRef.current) {
            setTimeout(() => {
                typeset(mathRef.current!)
            }, 10)
        }
    }, [isLoaded, formula, typeset, display, inline])

    let mathContent = ""
    if (inline) {
        mathContent = `$${formula}$`
    } else if (display) {
        mathContent = `$$${formula}$$`
    } else {
        // Auto-detect or default
        if (formula.includes("$$")) {
            mathContent = formula
        } else if (formula.startsWith("$") && formula.endsWith("$")) {
            mathContent = formula
        } else {
            mathContent = `$${formula}$`
        }
    }

    // Determine which style class to use
    const className = inline
        ? `${styles.mathFormulaInline} math-formula`
        : display
            ? `${styles.mathFormulaDisplay} math-formula-display`
            : `${styles.mathFormula} math-formula`

    return (<span
            ref={mathRef}
            className={className}
        >
      {mathContent}
    </span>)
}