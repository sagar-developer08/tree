import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import MonacoJsonEditor from './components/JsonEditor/MonacoJsonEditor';
import JsonVisualizer from './components/JsonVisualizer/JsonVisualizer';
import ControlPanel from './components/Controls/ControlPanel';
import { parseJson, collapseAllNodes, expandAllNodes } from './utils/jsonUtils';

// Start with empty JSON
const DEFAULT_JSON = '';

function App() {
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON);
  const [jsonData, setJsonData] = useState<any>(null);
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [collapsedNodes, setCollapsedNodes] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse JSON input when it changes
  useEffect(() => {
    if (isJsonValid && jsonInput) {
      const { data, error } = parseJson(jsonInput);
      if (!error) {
        setJsonData(data);
      }
    }
  }, [jsonInput, isJsonValid]);

  // Handle JSON input change
  const handleJsonChange = useCallback((value: string) => {
    setJsonInput(value);
  }, []);

  // Handle JSON validation
  const handleJsonValidate = useCallback((isValid: boolean) => {
    setIsJsonValid(isValid);
  }, []);

  // Handle orientation change
  const handleOrientationChange = useCallback((newOrientation: 'horizontal' | 'vertical') => {
    setOrientation(newOrientation);
  }, []);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Handle collapse all
  const handleCollapseAll = useCallback(() => {
    if (jsonData) {
      setCollapsedNodes(collapseAllNodes([]));
    }
  }, [jsonData]);

  // Handle expand all
  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(expandAllNodes());
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('files', files[0]);

    try {
      const response = await fetch('https://mkgapi.akashic.dhira.io/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // If the response contains ai_json_az, use it for visualization
      if (data.ai_json_az) {
        const jsonString = JSON.stringify(data.ai_json_az, null, 2);
        setJsonInput(jsonString);
        setJsonData(data.ai_json_az);
      } else {
        // Otherwise use the whole response
        const jsonString = JSON.stringify(data, null, 2);
        setJsonInput(jsonString);
        setJsonData(data);
      }
      
      setIsJsonValid(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  // Trigger file input click
  const handleUploadButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="App" style={{ backgroundColor: '#ffffff' }}>
      {/* <h1 className="app-title" style={{ 
        color: '#4a90e2', 
        fontWeight: 'bold',
        padding: '15px 0',
        margin: 0,
        borderBottom: '1px solid #e1e8ed',
        backgroundColor: '#ffffff'
      }}>JSON Visualizer & Editor</h1> */}
      
      <div className="upload-container" style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #e1e8ed'
      }}>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload} 
          style={{ display: 'none' }}
          accept=".json,.pdf,.txt,.docx"
        />
        <button 
          onClick={handleUploadButtonClick}
          style={{
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Uploading...' : 'Upload File'}
        </button>
        {uploadError && (
          <div style={{ color: 'red', marginLeft: '10px', alignSelf: 'center' }}>
            {uploadError}
          </div>
        )}
      </div>
      
      <ControlPanel
        onOrientationChange={handleOrientationChange}
        onSearch={handleSearch}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
        isJsonValid={isJsonValid}
      />
      
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
        <div className="visualizer-container" style={{ flex: 1, width: '100%' }}>
          {isJsonValid && jsonData ? (
            <JsonVisualizer
              jsonData={jsonData}
              searchTerm={searchTerm}
              orientation={orientation}
            />
          ) : (
            <div className="error-message" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '18px', color: '#666' }}>
              {jsonInput ? 'Please fix the JSON syntax errors' : 'Please upload a file to visualize'}
            </div>
          )}
        </div>
        
        {/* Hidden editor to maintain functionality */}
        <div style={{ display: 'none' }}>
          <MonacoJsonEditor
            value={jsonInput}
            onChange={handleJsonChange}
            onValidate={handleJsonValidate}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
