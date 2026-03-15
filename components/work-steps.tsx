"use client"

import { useMemo } from "react"
import { CheckCircle, Circle, Loader2 } from "lucide-react"

interface WorkStepsProps {
  isGenerating: boolean
  generationComplete: boolean
  generatedCode?: string
}

interface StepDefinition {
  id: string
  label: string
  detector: (code: string, generationComplete: boolean) => boolean
}

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: "init",
    label: "Initializing model...",
    detector: () => true,
  },
  {
    id: "html_structure",
    label: "Generating HTML structure...",
    detector: (code) => code.includes("<html") || code.includes("<body") || code.includes("<head"),
  },
  {
    id: "content",
    label: "Adding content...",
    detector: (code) =>
      code.includes("<div") ||
      code.includes("<p") ||
      code.includes("<h1") ||
      code.includes("<span") ||
      code.includes("<img") ||
      code.includes("<ul") ||
      code.includes("<section"),
  },
  {
    id: "styles",
    label: "Adding styles...",
    detector: (code) => code.includes("<style") || code.includes("class=") || code.includes("style="),
  },
  {
    id: "javascript",
    label: "Implementing JavaScript...",
    detector: (code, generationComplete) => {
      const hasJavaScript =
        code.includes("<script") ||
        code.includes("function") ||
        code.includes("addEventListener") ||
        code.includes("document.") ||
        code.includes("window.") ||
        code.includes("const ") ||
        code.includes("let ") ||
        code.includes("var ");

      if (!hasJavaScript) return false;
      if (generationComplete) return true;

      const scriptTagsCount = (code.match(/<script/g) || []).length;
      const closingScriptTagsCount = (code.match(/<\/script>/g) || []).length;

      return (
        scriptTagsCount === closingScriptTagsCount &&
        !code.trim().endsWith("function") &&
        !code.trim().endsWith("{") &&
        !code.trim().endsWith(";")
      );
    },
  },
  {
    id: "finalize",
    label: "Finalizing...",
    detector: (_code, generationComplete) => generationComplete,
  },
]

export function WorkSteps({ isGenerating, generationComplete, generatedCode = "" }: WorkStepsProps) {
  const steps = useMemo(() => {
    if (generationComplete) {
      return STEP_DEFINITIONS.map(def => ({ id: def.id, label: def.label, completed: true }))
    }
    if (!generatedCode) {
      return STEP_DEFINITIONS.map(def => ({ id: def.id, label: def.label, completed: false }))
    }
    return STEP_DEFINITIONS.map(def => ({
      id: def.id,
      label: def.label,
      completed: def.detector(generatedCode, generationComplete),
    }))
  }, [generatedCode, generationComplete])

  const currentStepIndex = steps.findIndex(step => !step.completed)

  return (
    <div className="space-y-1.5 h-full overflow-y-auto">
      {steps.map((step, index) => {
        const isCompleted = step.completed
        const isCurrent = !isCompleted && (currentStepIndex === -1 || index === currentStepIndex)

        return (
          <div key={step.id} className="flex items-center gap-1.5">
            {isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : isCurrent && isGenerating ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
            )}
            <span
              className={`text-xs sm:text-sm ${
                isCompleted
                  ? "text-gray-300"
                  : isCurrent
                    ? "text-white font-medium"
                    : "text-gray-600"
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
