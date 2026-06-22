import { useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  starterCode?: string;
}

export function CodeEditor({ language, value, onChange, starterCode }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    if (!value && starterCode) {
      editor.setValue(starterCode);
      onChange(starterCode);
    }
  };

  return (
    <Editor
      height="400px"
      defaultLanguage={language === "cpp" ? "cpp" : language}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}
