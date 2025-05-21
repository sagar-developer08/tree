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

  // Determine node color based on type - using colors that match the medical knowledge graph
  const getNodeColor = () => {
    switch (type) {
      case 'object': return '#4a6ee2'; // Blue for objects/containers
      case 'array': return '#50b83c'; // Green for arrays
      case 'string': 
        // Special colors for specific medical terms
        if (label === 'medication_name') return '#9c27b0';  // Purple for medication names
        if (label.includes('diagnosis')) return '#ff6b3d';  // Orange for diagnosis
        if (label === 'procedure') return '#2196f3';  // Blue for procedures
        return '#47525e';  // Dark gray for other strings
      case 'number': return '#f49342'; // Orange for numbers
      case 'boolean': return '#8a2be2'; // Purple for booleans
      case 'null': return '#de4c4a'; // Red for null
      default: return '#4a90e2'; // Default blue
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
  
  // Determine node style based on type and state - making it more like the medical graph
  const getNodeStyle = () => {
    const baseStyle = {
      background: '#ffffff',
      borderRadius: '4px',
      padding: '12px 16px',
      border: isHighlighted ? '2px solid #4a90e2' : '1px solid #e0e0e0',
      minWidth: isKeyValue ? '140px' : '170px',
      maxWidth: data.isCombinedValues ? '320px' : 'auto',
      cursor: isContainer ? 'pointer' : 'default',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
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
        style={{ background: '#ddd', width: '7px', height: '7px', border: '1px solid #ccc' }} 
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
            padding: '6px 10px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '15px',
            lineHeight: '1.5'
          }}>
            {String(value).split('\n').map((line, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{line}</div>
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
        style={{ background: '#ddd', width: '7px', height: '7px', border: '1px solid #ccc' }} 
      />
    </div>
  );
};

export default memo(JsonNode);
