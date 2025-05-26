import { Node, Edge, MarkerType } from 'reactflow';

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
  
  // Layout constants - optimized for horizontal tree layout with proper spacing
  const LEVEL_SPACING_X = 500;  // Horizontal spacing between levels (increased more)
  const MIN_NODE_SPACING_Y = 120;   // Minimum vertical spacing between sibling nodes (increased)
  const NODE_HEIGHT_ESTIMATE = 140; // Estimated node height for spacing calculations (increased)
  const START_X = 50;           // Starting X position
  const START_Y = 400;          // Starting Y position (center of viewport)
  
  // Track node positions by level
  const levelNodes: Map<number, Node<NodeData>[]> = new Map();
  
  // Create a root node
  const createRootNode = () => {
    const rootId = `root-${transformId}`;
    const rootNode: Node<NodeData> = {
      id: rootId,
      type: 'jsonNode',
      position: { x: START_X, y: START_Y },
      data: {
        label: 'root',
        value: jsonData,
        isCollapsed: collapsedNodes.get('root') || false,
        path: 'root',
        type: 'object',
        hideSymbols: true
      }
    };
    
    nodes.push(rootNode);
    addNodeToLevel(0, rootNode);
    
    return rootId;
  };
  
  // Add a node to its level for tracking vertical positions
  const addNodeToLevel = (level: number, node: Node<NodeData>) => {
    if (!levelNodes.has(level)) {
      levelNodes.set(level, []);
    }
    levelNodes.get(level)?.push(node);
  };
  
  // Calculate node positions for horizontal tree layout like JSONCrack
  const calculatePositions = () => {
    // First, calculate the tree structure and assign positions
    const nodePositions = new Map<string, { x: number; y: number }>();
    
         // Calculate the total height needed for each subtree with improved spacing
     const calculateSubtreeHeight = (nodeId: string): number => {
       const children = edges.filter(edge => edge.source === nodeId);
       if (children.length === 0) {
         return NODE_HEIGHT_ESTIMATE; // Leaf node height
       }
       
       let totalHeight = 0;
       children.forEach(edge => {
         totalHeight += calculateSubtreeHeight(edge.target);
       });
       
       // Add extra spacing between children to prevent overlap
       const extraSpacing = Math.max(0, children.length - 1) * MIN_NODE_SPACING_Y;
       const additionalBuffer = children.length > 1 ? children.length * 30 : 0; // Extra buffer for multiple children
       return Math.max(NODE_HEIGHT_ESTIMATE, totalHeight + extraSpacing + additionalBuffer);
     };
    
         // Position nodes recursively with better spacing
     const positionNode = (nodeId: string, x: number, y: number, availableHeight: number) => {
       nodePositions.set(nodeId, { x, y });
       
       const children = edges.filter(edge => edge.source === nodeId);
       if (children.length === 0) return;
       
       // Calculate the height each child should get
       const childHeights = children.map(edge => calculateSubtreeHeight(edge.target));
       const totalChildHeight = childHeights.reduce((sum, h) => sum + h, 0);
       
       // Add minimum spacing between children with extra buffer
       const baseSpacing = Math.max(0, children.length - 1) * MIN_NODE_SPACING_Y;
       const extraBuffer = children.length > 2 ? children.length * 20 : 0; // Extra spacing for many children
       const totalSpacing = baseSpacing + extraBuffer;
       const totalRequiredHeight = totalChildHeight + totalSpacing;
       
       // Position children vertically centered around the parent
       let currentY = y - (totalRequiredHeight / 2);
       
       children.forEach((edge, index) => {
         const childHeight = childHeights[index];
         const childCenterY = currentY + (childHeight / 2);
         
         positionNode(
           edge.target, 
           x + LEVEL_SPACING_X, 
           childCenterY, 
           childHeight
         );
         
         // Move to next position with proper spacing
         const dynamicSpacing = MIN_NODE_SPACING_Y + (children.length > 3 ? 20 : 0); // Extra spacing for crowded areas
         currentY += childHeight + dynamicSpacing;
       });
     };
    
         // Start positioning from root
     const rootNode = nodes.find(n => n.data.path === 'root');
     if (rootNode) {
       const totalTreeHeight = calculateSubtreeHeight(rootNode.id);
       positionNode(rootNode.id, START_X, START_Y, totalTreeHeight);
     }
     
     // Apply calculated positions to nodes and resolve any overlaps
     const resolveOverlaps = () => {
       const positionedNodes = Array.from(nodePositions.entries()).map(([id, pos]) => ({
         id,
         ...pos,
         node: nodes.find(n => n.id === id)
       })).filter(n => n.node);
       
       // Group nodes by X position (same level)
       const nodesByLevel = new Map<number, typeof positionedNodes>();
       positionedNodes.forEach(node => {
         if (!nodesByLevel.has(node.x)) {
           nodesByLevel.set(node.x, []);
         }
         nodesByLevel.get(node.x)?.push(node);
       });
       
            // Check and resolve overlaps within each level with improved spacing
     nodesByLevel.forEach(levelNodes => {
       levelNodes.sort((a, b) => a.y - b.y);
       
       // Multiple passes to ensure no overlaps
       for (let pass = 0; pass < 3; pass++) {
         for (let i = 1; i < levelNodes.length; i++) {
           const currentNode = levelNodes[i];
           const prevNode = levelNodes[i - 1];
           
           // Use a larger minimum distance to prevent overlaps
           const minDistance = NODE_HEIGHT_ESTIMATE + MIN_NODE_SPACING_Y + 20; // Extra padding
           const actualDistance = currentNode.y - prevNode.y;
           
           if (actualDistance < minDistance) {
             const adjustment = minDistance - actualDistance + 10; // Extra buffer
             currentNode.y += adjustment;
             nodePositions.set(currentNode.id, { x: currentNode.x, y: currentNode.y });
             
             // Propagate adjustment to subsequent nodes
             for (let j = i + 1; j < levelNodes.length; j++) {
               levelNodes[j].y += adjustment;
               nodePositions.set(levelNodes[j].id, { x: levelNodes[j].x, y: levelNodes[j].y });
             }
           }
         }
       }
       
       // Final pass: ensure minimum spacing between all nodes
       for (let i = 1; i < levelNodes.length; i++) {
         const currentNode = levelNodes[i];
         const prevNode = levelNodes[i - 1];
         const minGap = 150; // Minimum gap between node centers
         
         if (currentNode.y - prevNode.y < minGap) {
           const adjustment = minGap - (currentNode.y - prevNode.y);
           currentNode.y += adjustment;
           nodePositions.set(currentNode.id, { x: currentNode.x, y: currentNode.y });
           
           // Propagate to subsequent nodes
           for (let j = i + 1; j < levelNodes.length; j++) {
             levelNodes[j].y += adjustment;
             nodePositions.set(levelNodes[j].id, { x: levelNodes[j].x, y: levelNodes[j].y });
           }
         }
       }
     });
     };
     
     resolveOverlaps();
     
     // Apply final calculated positions to nodes
     nodes.forEach(node => {
       const position = nodePositions.get(node.id);
       if (position) {
         node.position = position;
       }
     });
  };
  
  // Process a node and create its children
  const processNode = (
    nodeId: string,
    data: any,
    path: string,
    level: number = 0
  ) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const isCollapsed = node.data.isCollapsed;
    const nodeType = getValueType(data);
    
    // For leaf nodes or collapsed nodes, no further processing
    if (isCollapsed || (nodeType !== 'object' && nodeType !== 'array')) {
      return;
    }
    
    if (nodeType === 'object') {
      const entries = Object.entries(data);
      
      // Skip empty objects - don't create child nodes for them
      if (entries.length === 0) {
        return;
      }
      
      // Special case for simple objects with only primitive values
      const isSimpleObject = 
        entries.length > 0 && 
        entries.every(([_, v]) => typeof v !== 'object' || v === null);
      
      if (isSimpleObject) {
        // Filter out null, undefined, and empty string values to avoid empty nodes
        const validEntries = entries.filter(([_, v]) => 
          v !== null && v !== undefined && v !== ''
        );
        
        // If no valid entries after filtering, skip creating this node
        if (validEntries.length === 0) {
          return;
        }
        
        // Create a single combined node for all primitive properties
        const combinedNodeId = `${path}-values-${transformId}`;
        
        // Format property values as strings
        const propertyValues = validEntries
          .map(([propKey, propValue]) => {
            const propType = getValueType(propValue);
            const formattedValue = propType === 'string' ? `"${propValue}"` : String(propValue);
            return `${propKey}: ${formattedValue}`;
          })
          .join('\n');
        
        // Create values node
        const valuesNode: Node<NodeData> = {
          id: combinedNodeId,
          type: 'jsonNode',
          position: { x: 0, y: 0 }, // Will be set in calculatePositions
          data: {
            label: 'values:',
            value: propertyValues,
            isCollapsed: false,
            path: `${path}.values`,
            type: 'properties',
            isPropertyContainer: true,
            isCombinedValues: true,
            hideSymbols: true
          }
        };
        
        nodes.push(valuesNode);
        addNodeToLevel(level + 1, valuesNode);
        
        // Connect parent to values node
        edges.push({
          id: `${nodeId}-${combinedNodeId}`,
          source: nodeId,
          target: combinedNodeId,
          type: 'bezier',
          style: { stroke: '#aaa', strokeWidth: 1 },
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#aaa',
            width: 4,
            height: 4
          }
        });
        
        return;
      }
      
      // Filter valid entries for count
      const validEntries = entries.filter(([_, v]) => 
        v !== null && v !== undefined && v !== ''
      );
      
      // Add count to parent node label (only count valid entries)
      if (validEntries.length > 0) {
        node.data.label = `${node.data.label} [${validEntries.length}]`;
      }
        
      // Create child nodes, but skip null, undefined, and empty string values
      entries.forEach(([key, value], i) => {
        // Skip creating nodes for null, undefined, or empty string values
        if (value === null || value === undefined || value === '') {
          return;
        }
        
        const childPath = `${path}.${key}`;
        const childId = `${childPath}-${transformId}`;
        const childType = getValueType(value);
        const isChildCollapsed = collapsedNodes.get(childPath) || false;
        
        // Create child node
        const childNode: Node<NodeData> = {
          id: childId,
          type: 'jsonNode',
          position: { x: 0, y: 0 }, // Will be set in calculatePositions
          data: {
            label: key,
            value: value,
            isCollapsed: isChildCollapsed,
            path: childPath,
            type: childType,
            hideSymbols: childType === 'array' || childType === 'object' // Hide symbols for arrays and objects
          }
        };
        
        nodes.push(childNode);
        addNodeToLevel(level + 1, childNode);
        
        // Connect parent to child
        edges.push({
          id: `${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          type: 'bezier',
          style: { stroke: '#aaa', strokeWidth: 1 },
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#aaa',
            width: 4,
            height: 4
          }
        });
        
        // Process child node recursively
        processNode(childId, value, childPath, level + 1);
      });
    } else if (nodeType === 'array') {
      const items = data as any[];
      
      // Skip empty arrays - don't create child nodes for them
      if (items.length === 0) {
        return;
      }
      
      // Filter valid items for count
      const validItems = items.filter(item => 
        item !== null && item !== undefined && item !== ''
      );
      
      // Add count to parent node label (only count valid items)
      if (validItems.length > 0) {
        node.data.label = `${node.data.label} [${validItems.length}]`;
      }
        
      // Process array items directly without creating index nodes
      items.forEach((item, i) => {
        // Skip creating nodes for null, undefined, or empty string values
        if (item === null || item === undefined || item === '') {
          return;
        }
        
        const itemType = getValueType(item);
        
        // For primitive values, create a simple node to show the value
        if (itemType !== 'object' && itemType !== 'array') {
          const childPath = `${path}[${i}]`;
          const childId = `${childPath}-${transformId}`;
          const isChildCollapsed = collapsedNodes.get(childPath) || false;
          
          // Create a simple node for primitive values
          const childNode: Node<NodeData> = {
            id: childId,
            type: 'jsonNode',
            position: { x: 0, y: 0 }, // Will be set in calculatePositions
            data: {
              label: String(item), // Use the actual value as the label
              value: item,
              isCollapsed: isChildCollapsed,
              path: childPath,
              type: itemType,
              hideSymbols: true // Hide symbols for cleaner primitive display
            }
          };
          
          nodes.push(childNode);
          addNodeToLevel(level + 1, childNode);
          
          // Connect parent array to primitive value
          edges.push({
            id: `${nodeId}-${childId}`,
            source: nodeId,
            target: childId,
            type: 'bezier',
            style: { stroke: '#aaa', strokeWidth: 1 },
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#aaa',
              width: 4,
              height: 4
            }
          });
          
          return;
        }
        
        // For objects and arrays, create nodes directly without index wrapper
        const childPath = `${path}[${i}]`;
        const childId = `${childPath}-${transformId}`;
        const isChildCollapsed = collapsedNodes.get(childPath) || false;
        
        // Determine the label for the child node
        let childLabel = '';
        if (itemType === 'object' && item && typeof item === 'object') {
          // Try to use a meaningful property as label (like 'name', 'title', etc.)
          const meaningfulKeys = ['name', 'title', 'label', 'id', 'key', 'type', 'medication_name', 'diagnosis', 'procedure'];
          for (const key of meaningfulKeys) {
            if (item[key] && typeof item[key] === 'string') {
              childLabel = item[key];
              break;
            }
          }
          // If no meaningful key found, use the object type or first available string property
          if (!childLabel) {
            const firstStringValue = Object.entries(item).find(([_, v]) => typeof v === 'string' && v.trim() !== '');
            if (firstStringValue) {
              childLabel = firstStringValue[1] as string;
            } else {
              childLabel = 'object';
            }
          }
        } else {
          // For non-objects, use a generic label based on type
          childLabel = itemType;
        }
        
        // Create child node directly for the item content
        const childNode: Node<NodeData> = {
          id: childId,
          type: 'jsonNode',
          position: { x: 0, y: 0 }, // Will be set in calculatePositions
          data: {
            label: childLabel,
            value: item,
            isCollapsed: isChildCollapsed,
            path: childPath,
            type: itemType,
            hideSymbols: true // Hide brackets/braces for cleaner look
          }
        };
        
        nodes.push(childNode);
        addNodeToLevel(level + 1, childNode);
        
        // Connect parent array directly to child content
        edges.push({
          id: `${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          type: 'bezier',
          style: { stroke: '#aaa', strokeWidth: 1 },
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#aaa',
            width: 4,
            height: 4
          }
        });
        
        // Process child node recursively
        processNode(childId, item, childPath, level + 1);
      });
    }
  };
  
  // Create root and build the tree
  const rootId = createRootNode();
  processNode(rootId, jsonData, 'root');
  
  // Calculate final positions to avoid overlaps
  calculatePositions();
  
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
