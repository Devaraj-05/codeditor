'use client';

import { FileIcon as FileHtml, FileCode, FileJson } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

type CodeEditorProps = {
  language: 'html' | 'css' | 'javascript';
  value: string;
  onChange: (value: string) => void;
};

const languageIcons = {
  html: FileHtml,
  css: FileCode,
  javascript: FileJson,
};

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const Icon = languageIcons[language];
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <h2 className="text-sm font-medium uppercase">{language}</h2>
      </div>
      <div className="border rounded-lg overflow-hidden bg-muted">
        <Editor
          height="200px"
          defaultLanguage={language}
          value={value}
          onChange={(value) => onChange(value || '')}
          theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
          options={{
            minimap: { enabled: false },
            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
            fontSize: 14,
            padding: { top: 16 },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            renderLineHighlight: 'none',
          }}
        />
      </div>
    </div>
  );
}
