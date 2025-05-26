import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../utils/jsonUtils';

interface JsonNodeProps extends NodeProps<NodeData> {
  onNodeClick: (path: string) => void;
  isHighlighted: boolean;
}

const JsonNode: React.FC<JsonNodeProps> = ({ 
  data, 
  onNodeClick,
  isHighlighted
}) => {
  const { label, value, isCollapsed, path, type } = data;
  
  // Format the display value based on type
  const getDisplayValue = () => {
    if (type === 'string') {
      return `"${value}"`;
    }
    if (type === 'null') {
      return 'null';
    }
    if (type === 'object') {
      // Hide curly braces if hideSymbols is true
      if (data.hideSymbols) {
        return isCollapsed ? '...' : '';
      }
      return isCollapsed ? '{...}' : '{';
    }
    if (type === 'array') {
      // Hide square brackets if hideSymbols is true
      if (data.hideSymbols) {
        return isCollapsed ? '...' : '';
      }
      return isCollapsed ? '[...]' : '[';
    }
    return String(value);
  };

  // Determine node color based on type - JSONCrack-like colors
  const getNodeColor = () => {
    switch (type) {
      case 'object': return '#3b82f6'; // Blue for objects/containers
      case 'array': return '#10b981'; // Green for arrays
      case 'string': 
        // Special colors for specific medical terms
        if (label === 'medication_name') return '#8b5cf6';  // Purple for medication names
        if (label.includes('diagnosis')) return '#f59e0b';  // Orange for diagnosis
        if (label === 'procedure') return '#06b6d4';  // Cyan for procedures
        return '#6b7280';  // Gray for other strings
      case 'number': return '#f59e0b'; // Orange for numbers
      case 'boolean': return '#8b5cf6'; // Purple for booleans
      case 'null': return '#ef4444'; // Red for null
      case 'properties': return '#6366f1'; // Indigo for combined properties
      default: return '#3b82f6'; // Default blue
    }
  };

  const handleClick = () => {
    if (type === 'object' || type === 'array') {
      onNodeClick(path);
    }
  };

  // Determine if this is a key-value node or a container node
  const isContainer = type === 'object' || type === 'array';
  const isKeyValue = !isContainer;
  const isRoot = path === 'root';
  const isArrayItem = label.startsWith('[') && label.endsWith(']');
  
  // Determine node style based on type and state - JSONCrack-like appearance with consistent sizing
  const getNodeStyle = () => {
    const baseStyle = {
      background: '#ffffff',
      borderRadius: '8px',
      padding: '12px 16px',
      border: isHighlighted ? '2px solid #3b82f6' : '1px solid #d1d5db',
      minWidth: isKeyValue ? '200px' : '220px',  // Increased for better spacing
      maxWidth: data.isCombinedValues ? '380px' : '320px',  // Increased max widths
      minHeight: '60px',  // Ensure minimum height for consistent spacing
      cursor: isContainer ? 'pointer' : 'default',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      wordWrap: 'break-word' as const,
      overflow: 'hidden',
      transition: 'all 0.2s ease-in-out',
      position: 'relative' as const
    };
    
    return baseStyle;
  };

  // Format the label based on node type
  const getFormattedLabel = () => {
    if (isRoot) {
      return 'root';
    }
    
    if (isArrayItem) {
      return label;
    }
    
    return label;
  };
  
  // Get array length or object key count for display
  const getCollectionSize = () => {
    if (type === 'array') {
      return Array.isArray(value) ? value.length : 0;
    }
    if (type === 'object') {
      return Object.keys(value).length;
    }
    return 0;
  };
  
  // Check if this is a nested object with primitives (like 'nutrients')
  const isNestedObject = type === 'object' && data.isNestedObjectWithPrimitives;

  return (
    <div 
      className={`json-node ${isHighlighted ? 'highlighted' : ''}`}
      style={getNodeStyle()}
      onClick={handleClick}
    >
      {/* Input handle for target connections */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          background: '#e5e7eb', 
          width: '6px', 
          height: '6px', 
          border: '1px solid #d1d5db',
          opacity: 0.7
        }} 
      />
      
      {isContainer ? (
        <>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ 
              fontWeight: path === 'root' ? 'normal' : 'bold', 
              color: getNodeColor(),
              fontSize: '16px'
            }}>
              {getFormattedLabel()}
            </div>
            
            {/* Show collection size for arrays and objects */}
            {(type === 'array' || type === 'object') && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {/* For nested objects like 'nutrients', show count like medical graph */}
                <div style={{ 
                  fontSize: '14px', 
                  color: '#888',
                  backgroundColor: '#f8f9fa',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 'normal'
                }}>
                  {/* Format like the medical graph [3] or {1} */}
                  {type === 'array' ? `[${getCollectionSize()}]` : `{${getCollectionSize()}}`}
                </div>
                
                {/* Link indicator similar to medical graph */}
                <div 
                  style={{
                    fontSize: '14px',
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent node click
                    onNodeClick(path);
                  }}
                >
                  ⇢
                </div>
              </div>
            )}
          </div>
          
          {/* For arrays and objects, show the opening bracket/brace */}
          {!isCollapsed && !data.hideSymbols && (
            <div style={{ 
              fontSize: '12px', 
              color: '#6272a4'
            }}>
              {type === 'object' ? '{' : '['}
            </div>
          )}
        </>
      ) : data.isCombinedValues ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ 
            fontSize: '15px', 
            color: '#6272a4',
            fontWeight: 'bold'
          }}>
            {label}:
          </div>
          <div style={{ 
            color: '#333',
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f8f8f8',
            padding: '8px 12px',
            borderRadius: '4px',
            maxHeight: '250px',  // Increased max height
            overflowY: 'auto',
            fontSize: '14px',
            lineHeight: '1.6',  // Better line spacing
            border: '1px solid #e8e8e8'
          }}>
            {String(value).split('\n').map((line, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>{line}</div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ 
            fontSize: '16px', 
            color: '#666',
            fontWeight: 'normal'
          }}>
            {label}:
          </div>
          <div style={{ 
            fontSize: '16px', 
            color: getNodeColor(),
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {getDisplayValue()}
          </div>
        </div>
      )}
      
      {/* Output handle for source connections */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: '#e5e7eb', 
          width: '6px', 
          height: '6px', 
          border: '1px solid #d1d5db',
          opacity: 0.7
        }} 
      />
    </div>
  );
};

export default memo(JsonNode);
