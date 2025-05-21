import { Node, Edge } from 'reactflow';

export interface NodeData {
  label: string;
  value: any;
  isCollapsed: boolean;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'properties';
  isNestedObjectWithPrimitives?: boolean;
  isPropertyContainer?: boolean;
  isProperty?: boolean;
  isCombinedValues?: boolean;
  hideSymbols?: boolean; // Add a flag to hide curly braces
}

// Generate a unique ID for nodes
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Determine the type of a JSON value
const getValueType = (value: any): NodeData['type'] => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string'; // Default fallback
};

// Transform JSON data into React Flow nodes and edges
export const transformJsonToFlow = (
  jsonData: any,
  collapsedNodes: Map<string, boolean> = new Map()
): { nodes: Node<NodeData>[], edges: Edge[] } => {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];
  
  // Generate a unique ID for this transformation to avoid node ID collisions
  const transformId = generateId().substring(0, 4);
  
  // Create a root node
  const createRootNode = () => {
    const rootId = `root-${transformId}`;
    nodes.push({
      id: rootId,
      type: 'jsonNode',
      position: { x: 150, y: 400 },
      data: {
        label: 'root',
        value: jsonData,
        isCollapsed: collapsedNodes.get('root') || false,
        path: 'root',
        type: 'object',
        hideSymbols: true // Add flag to hide curly braces
      }
    });
    return rootId;
  };
  
  // Process a node and its children
  const processNode = (
    nodeId: string,
    data: any,
    path: string,
    level: number,
    startY: number = 0
  ): number => {
    // Skip processing if this node is collapsed
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return startY;
    
    const isCollapsed = node.data.isCollapsed;
    if (isCollapsed) return startY + 200; // Return fixed height for collapsed nodes
    
    const nodeType = getValueType(data);
    let currentY = startY;
    
    // Process children based on node type
    if (nodeType === 'object' && !isCollapsed) {
      // Process object properties
      const entries = Object.entries(data);
      
      entries.forEach(([key, value], index) => {
        const childPath = `${path}.${key}`;
        const childId = `${childPath}-${transformId}`;
        const childType = getValueType(value);
        const isChildCollapsed = collapsedNodes.get(childPath) || false;
        
        // Check if this is a nested object with primitive values (like 'nutrients')
        const isNestedObjectWithPrimitives = 
          childType === 'object' && 
          Object.values(value as Record<string, unknown>).every(v => 
            typeof v !== 'object' || v === null
          );
        
        // Create child node - Using horizontal layout positioning
        nodes.push({
          id: childId,
          type: 'jsonNode',
          position: { x: level * 380, y: currentY },
          data: {
            label: key,
            value: value,
            isCollapsed: isChildCollapsed,
            path: childPath,
            type: childType,
            // Add a special flag for nested objects with primitives
            isNestedObjectWithPrimitives: isNestedObjectWithPrimitives,
            hideSymbols: true // Hide all braces and brackets
          }
        });
        
        // Create edge from parent to child
        edges.push({
          id: `${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          type: 'smoothstep',
          style: { stroke: '#cccccc', strokeWidth: 1.5 },
          animated: false
        });
        
        // For nested objects with primitives, create their children differently
        if (isNestedObjectWithPrimitives && !isChildCollapsed) {
          // Create a single combined node for all properties
          const combinedNodeId = `${childPath}-combined-${transformId}`;
          
          // Get all the property values as a formatted string
          const propertyValues = Object.entries(value as Record<string, unknown>)
            .map(([propKey, propValue]) => {
              const propType = getValueType(propValue);
              const formattedValue = propType === 'string' ? `"${propValue}"` : String(propValue);
              return `${propKey}: ${formattedValue}`;
            })
            .join('\n');
          
          // Create the combined node with all properties - horizontal layout
          nodes.push({
            id: combinedNodeId,
            type: 'jsonNode',
            position: { x: (level + 1) * 380, y: currentY },
            data: {
              label: 'values',
              value: propertyValues,
              isCollapsed: false,
              path: `${childPath}.values`,
              type: 'properties',
              isPropertyContainer: true,
              isCombinedValues: true,
              hideSymbols: true // Hide all braces and brackets
            }
          });
          
          // Connect the nested object to its combined values node
          edges.push({
            id: `${childId}-${combinedNodeId}`,
            source: childId,
            target: combinedNodeId,
            type: 'smoothstep',
            style: { stroke: '#cccccc', strokeWidth: 1.5 },
            animated: false
          });
          
          currentY += 200; // Increase Y for next node (vertical spacing)
        }
        // Process regular child's children if it's an object or array
        else if ((childType === 'object' || childType === 'array') && !isChildCollapsed) {
          currentY = processNode(childId, value, childPath, level + 1, currentY);
        } else {
          currentY += 200; // Increased spacing for leaf nodes
        }
      });
    } else if (nodeType === 'array' && !isCollapsed) {
      // Process array items
      data.forEach((item: any, index: number) => {
        const childPath = `${path}[${index}]`;
        const childId = `${childPath}-${transformId}`;
        const childType = getValueType(item);
        const isChildCollapsed = collapsedNodes.get(childPath) || false;
        
        // Create child node - horizontal layout
        nodes.push({
          id: childId,
          type: 'jsonNode',
          position: { x: level * 380, y: currentY },
          data: {
            label: ``, // Remove the [index] label for array items
            value: item,
            isCollapsed: isChildCollapsed,
            path: childPath,
            type: childType,
            hideSymbols: true // Hide all braces and brackets
          }
        });
        
        // Create edge from parent to child
        edges.push({
          id: `${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          type: 'smoothstep',
          style: { stroke: '#cccccc', strokeWidth: 1.5 },
          animated: false
        });
        
        // Process child's children if it's an object or array
        if ((childType === 'object' || childType === 'array') && !isChildCollapsed) {
          currentY = processNode(childId, item, childPath, level + 1, currentY);
        } else {
          currentY += 200; // Increased spacing for leaf nodes
        }
      });
    }
    
    return currentY;
  };
  
  // Create the root node and process the entire JSON tree
  const rootId = createRootNode();
  processNode(rootId, jsonData, 'root', 1);
  
  return { nodes, edges };
};

// Toggle the collapsed state of a node
export const toggleNodeCollapse = (
  path: string,
  collapsedNodes: Map<string, boolean>
): Map<string, boolean> => {
  const newCollapsedNodes = new Map(collapsedNodes);
  const currentState = newCollapsedNodes.get(path) || false;
  newCollapsedNodes.set(path, !currentState);
  return newCollapsedNodes;
};

// Collapse all nodes
export const collapseAllNodes = (
  nodes: Node<NodeData>[]
): Map<string, boolean> => {
  const collapsedNodes = new Map<string, boolean>();
  
  nodes.forEach(node => {
    if (node.data.type === 'object' || node.data.type === 'array') {
      collapsedNodes.set(node.data.path, true);
    }
  });
  
  return collapsedNodes;
};

// Expand all nodes
export const expandAllNodes = (): Map<string, boolean> => {
  return new Map<string, boolean>();
};

// Find nodes by search term (key or value)
export const findNodes = (
  nodes: Node<NodeData>[],
  searchTerm: string
): string[] => {
  const matchingPaths: string[] = [];
  
  if (!searchTerm.trim()) {
    return matchingPaths;
  }
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  nodes.forEach(node => {
    const { label, value, path } = node.data;
    
    // Check if the key matches
    if (label.toLowerCase().includes(lowerSearchTerm)) {
      matchingPaths.push(path);
      return;
    }
    
    // Check if the value matches (for primitive types)
    if (
      typeof value === 'string' &&
      value.toLowerCase().includes(lowerSearchTerm)
    ) {
      matchingPaths.push(path);
      return;
    }
    
    if (
      (typeof value === 'number' || typeof value === 'boolean') &&
      String(value).toLowerCase().includes(lowerSearchTerm)
    ) {
      matchingPaths.push(path);
    }
  });
  
  return matchingPaths;
};

// Parse JSON safely
export const parseJson = (jsonString: string): { data: any; error: string | null } => {
  try {
    const data = JSON.parse(jsonString);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
};

// Get a sample JSON that's similar to the one in the JSONCrack example
export const getSampleJson = (): string => {
  return JSON.stringify({
    "fruits": [
      {
        "name": "Apple",
        "color": "Red",
        "nutrients": {
          "calories": 52,
          "fiber": "2.4g",
          "vitamin": "4.6mg"
        }
      },
      {
        "name": "Banana",
        "color": "Yellow",
        "nutrients": {
          "calories": 89,
          "fiber": "2.6g",
          "potassium": "358mg"
        }
      },
      {
        "name": "Orange",
        "color": "Orange",
        "nutrients": {
          "calories": 47,
          "fiber": "2.4g",
          "vitamin": "53.2mg"
        }
      }
    ]
  }, null, 2);
};
