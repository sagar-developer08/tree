import React from 'react';

interface ControlPanelProps {
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void;
  onSearch: (term: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  isJsonValid: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onOrientationChange,
  onSearch,
  onCollapseAll,
  onExpandAll,
  isJsonValid
}) => {
  return (
    <div className="control-panel" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      padding: '8px 16px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      alignItems: 'center'
    }}>
      <div className="control-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label htmlFor="orientation" style={{ color: '#333', fontWeight: 500, fontSize: '14px' }}>Layout:</label>
        <select 
          id="orientation"
          onChange={(e) => onOrientationChange(e.target.value as 'horizontal' | 'vertical')}
          defaultValue="horizontal"
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>
      
      <div className="control-group">
        <input
          type="text"
          placeholder="Search keys or values..."
          onChange={(e) => onSearch(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            width: '200px',
            fontSize: '14px'
          }}
        />
      </div>
      
      {/* <div className="control-group" style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCollapseAll}
          disabled={!isJsonValid}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            cursor: isJsonValid ? 'pointer' : 'not-allowed',
            opacity: isJsonValid ? 1 : 0.6,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Collapse All
        </button>
        
        <button
          onClick={onExpandAll}
          disabled={!isJsonValid}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            cursor: isJsonValid ? 'pointer' : 'not-allowed',
            opacity: isJsonValid ? 1 : 0.6,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Expand All
        </button>
      </div>
      
      <div className="json-status" style={{
        marginLeft: 'auto',
        color: isJsonValid ? '#4caf50' : '#f44336',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px'
      }}>
        {isJsonValid ? 'Valid JSON ✓' : 'Invalid JSON ✗'}
      </div> */}
    </div>
  );
};

export default ControlPanel;
