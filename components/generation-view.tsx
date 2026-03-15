"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import debounce from "lodash.debounce"
import { Badge } from "@/components/ui/badge"
import { Download, RefreshCw } from "lucide-react"
import { ThinkingIndicator } from "@/components/thinking-indicator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

import { CodePanel, PreviewPanel } from "@/components/generation-panels"

const darkModeStyle = `
  <style>
    :root {
      color-scheme: dark;
    }
    html, body {
      background-color: #121212;
      color: #ffffff;
      min-height: 100%;
    }
    body {
      margin: 0;
      padding: 0;
    }
    /* Smooth transition for body background */
    body {
      transition: background-color 0.2s ease;
    }
  </style>
`;

function prepareHtmlContent(code: string): string {
  let result = "";

  if (code.includes('<head>')) {
    result = code.replace('<head>', `<head>${darkModeStyle}`);
  } else if (code.includes('<html>')) {
    result = code.replace('<html>', `<html><head>${darkModeStyle}</head>`);
  } else {
    result = `
      <!DOCTYPE html>
      <html>
        <head>
          ${darkModeStyle}
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  }

  return result;
}

interface GenerationViewProps {
  prompt: string
  setPrompt: (value: string) => void
  model: string
  provider?: string
  generatedCode: string
  isGenerating: boolean
  generationComplete: boolean
  onRegenerateWithNewPrompt: (newPrompt: string) => void
  thinkingOutput?: string
  isThinking?: boolean
}

export function GenerationView({
  prompt,
  setPrompt,
  model,
  provider = 'deepseek',
  generatedCode,
  isGenerating,
  generationComplete,
  onRegenerateWithNewPrompt,
  thinkingOutput = "",
  isThinking = false
}: GenerationViewProps) {
  const [viewportSize, setViewportSize] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [isEditable, setIsEditable] = useState(false)
  const [editedCode, setEditedCode] = useState(generatedCode)
  const [originalCode, setOriginalCode] = useState(generatedCode)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [previewContent, setPreviewContent] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPrompt, setNewPrompt] = useState("")

  const prevContentRef = useRef<string>("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdatePreview = useCallback(
    debounce((code: string) => {
      const preparedHtml = prepareHtmlContent(code);
      prevContentRef.current = preparedHtml;
      setPreviewContent(preparedHtml);
    }, 200),
    []
  );

  useEffect(() => {
    setEditedCode(generatedCode)
    setOriginalCode(generatedCode)
    setHasChanges(false)

    if (generatedCode) {
      debouncedUpdatePreview(generatedCode);
    }
  }, [generatedCode, debouncedUpdatePreview])

  useEffect(() => {
    if (editedCode !== originalCode) {
      setHasChanges(true)
    } else {
      setHasChanges(false)
    }

    if (editedCode) {
      debouncedUpdatePreview(editedCode);
    }
  }, [editedCode, originalCode, debouncedUpdatePreview])

  const saveChanges = () => {
    setOriginalCode(editedCode)
    setHasChanges(false)
  }

  const copyToClipboard = () => {
    const currentCode = isEditable ? editedCode : originalCode
    navigator.clipboard.writeText(currentCode)
      .then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      })
      .catch(err => {
        console.error('Error copying:', err)
      })
  }

  const refreshPreview = () => {
    const currentCode = isEditable ? editedCode : originalCode;
    debouncedUpdatePreview.flush();
    const preparedHtml = prepareHtmlContent(currentCode);
    setPreviewContent(preparedHtml);
    setPreviewKey(prevKey => prevKey + 1);
  }

  const downloadCode = () => {
    const currentCode = isEditable ? editedCode : originalCode
    const element = document.createElement("a")
    const file = new Blob([currentCode], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = "generated-website.html"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSendNewPrompt = () => {
    if (!newPrompt.trim() || isGenerating) return
    onRegenerateWithNewPrompt(newPrompt)
    setNewPrompt("")
  }

  // Props bundles for subcomponents
  const codePanelProps = {
    isGenerating,
    generationComplete,
    isEditable,
    setIsEditable,
    hasChanges,
    saveChanges,
    copyToClipboard,
    copySuccess,
    generatedCode,
    editedCode,
    originalCode,
    setEditedCode,
    previousPrompt: prompt,
    newPrompt,
    setNewPrompt,
    handleSendNewPrompt,
    setShowSaveDialog
  }

  const previewPanelProps = {
    generationComplete,
    refreshPreview,
    viewportSize,
    setViewportSize,
    originalCode,
    editedCode,
    isGenerating,
    previewKey,
    previewContent
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">
              {provider === 'deepseek' ? 'DEEPSEEK' :
                provider === 'openai_compatible' ? 'CUSTOM API' :
                  provider === 'ollama' ? 'OLLAMA' :
                    provider === 'lm_studio' ? 'LM STUDIO' : 'AI'}
            </h1>
            <Badge variant="outline" className="bg-gray-900 text-white border-white">
              {model}
            </Badge>
            {thinkingOutput && (
              <div className="ml-2">
                <ThinkingIndicator
                  thinkingOutput={thinkingOutput}
                  isThinking={isThinking}
                  position="top-left"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 h-8"
              disabled={isGenerating}
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Restart</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 h-8"
              disabled={!generatedCode || isGenerating}
              onClick={downloadCode}
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Tab-Navigation */}
      <div className="md:hidden flex border-b border-gray-800 bg-gray-900/50">
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === "code" ? "text-white border-b-2 border-white" : "text-gray-400"
            }`}
          onClick={() => setActiveTab("code")}
        >
          CODE
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === "preview" ? "text-white border-b-2 border-white" : "text-gray-400"
            }`}
          onClick={() => setActiveTab("preview")}
        >
          PREVIEW
        </button>
      </div>

      {/* Hauptinhalt - Flexibler und responsiver mit Resizable Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden w-full h-full flex flex-col">
          <div className={`h-full flex-col ${activeTab === "code" ? "flex" : "hidden"}`}>
            <CodePanel {...codePanelProps} />
          </div>
          <div className={`h-full flex-col ${activeTab === "preview" ? "flex" : "hidden"}`}>
            <PreviewPanel {...previewPanelProps} />
          </div>
        </div>

        {/* Desktop View - Resizable Panels */}
        <div className="hidden md:block w-full h-full">
          <ResizablePanelGroup
            direction="horizontal"
            className="w-full h-full"
          >
            {/* Linke Spalte - Code-Editor und Steuerelemente */}
            <ResizablePanel defaultSize={65} minSize={30}>
              <CodePanel {...codePanelProps} />
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle withHandle className="bg-gray-800 hover:bg-gray-700" />

            {/* Rechte Spalte - Live-Vorschau */}
            <ResizablePanel defaultSize={35} minSize={25}>
              <PreviewPanel {...previewPanelProps} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Speichern-Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Save changes?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Do you want to save your changes before switching to read-only mode?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditedCode(originalCode);
                setIsEditable(false);
                setShowSaveDialog(false);
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Don't save
            </Button>
            <Button
              onClick={() => {
                saveChanges();
                setIsEditable(false);
                setShowSaveDialog(false);
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
