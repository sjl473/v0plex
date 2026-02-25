"use client"

import {useEffect, useRef} from "react"
import {useMathJax} from "./mathjax-provider"

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

    return (<span
            ref={mathRef}
            className={inline ? "math-formula" : display ? "math-formula-display" : "math-formula"}
            style={{
                color: "var(--v0plex-text-primary)",
                display: inline ? "inline" : display ? "block" : "inline-block",
                textAlign: display ? "center" : "inherit",
                margin: display ? "1.5rem 0" : inline ? "0" : "0 0.25rem",
                minHeight: display ? "2rem" : "1rem",
                verticalAlign: inline ? "baseline" : "inherit",
            }}
        >
      {mathContent}
    </span>)
}