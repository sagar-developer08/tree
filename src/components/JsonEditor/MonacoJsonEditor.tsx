import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (isValid: boolean) => void;
}

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({ 
  value, 
  onChange, 
  onValidate 
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Handle editor mount
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Set up JSON schema validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [],
      allowComments: true,
      trailingCommas: 'warning'
    });
  };

  // Handle editor validation
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = editor.getModelMarkers({ resource: model.uri });
        const hasErrors = markers.some(marker => marker.severity === 8); // Error severity
        onValidate(!hasErrors);
      }
    }
  }, [value, onValidate]);

  return (
    <div className="monaco-editor-container" style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          wordWrap: 'on',
          theme: 'vs-dark'
        }}
      />
    </div>
  );
};

export default MonacoJsonEditor;
