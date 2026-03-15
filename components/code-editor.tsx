"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface CodeEditorProps {
  code: string;
  isEditable?: boolean;
  onChange?: (value: string) => void;
}

export function CodeEditor({ code, isEditable = false, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isUserEditing, setIsUserEditing] = useState(false);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Only scroll to the end on initial load
    if (isInitialMount) {
      editor.revealLine(editor.getModel().getLineCount());
      setIsInitialMount(false);
    }

    // Add event listener for user interactions
    editor.onDidChangeCursorPosition(() => {
      if (isEditable) {
        setIsUserEditing(true);
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      // Only scroll to the end if the user is not actively editing
      // or if the editor is not in edit mode
      if (!isUserEditing && !isEditable) {
        editorRef.current.revealLine(editorRef.current.getModel().getLineCount());
      }
    }
  }, [code, isUserEditing, isEditable]);

  // Reset the isUserEditing status when edit mode is disabled
  useEffect(() => {
    if (!isEditable) {
      setIsUserEditing(false);
    }
  }, [isEditable]);

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        height="100%"
        language="html"
        theme="vs-dark"
        value={code}
        options={{
          readOnly: !isEditable,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true, // Automatically adjusts the size
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
    </div>
  )
}
