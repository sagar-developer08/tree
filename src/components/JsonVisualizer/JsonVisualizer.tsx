import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  NodeTypes,
  Panel,
  ConnectionLineType,
  ConnectionMode,
  ReactFlowInstance,
  BackgroundVariant,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import JsonNode from './JsonNode';
import { transformJsonToFlow, toggleNodeCollapse, collapseAllNodes, expandAllNodes, findNodes } from '../../utils/jsonUtils';

interface JsonVisualizerProps {
  jsonData: any;
  searchTerm: string;
  orientation: 'horizontal' | 'vertical';
}

const JsonVisualizer: React.FC<JsonVisualizerProps> = ({ 
  jsonData, 
  searchTerm,
  orientation 
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Map<string, boolean>>(new Map());
  const [highlightedPaths, setHighlightedPaths] = useState<string[]>([]);
  
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Define custom node types
  const nodeTypes: NodeTypes = {
    jsonNode: (props: any) => (
      <JsonNode 
        {...props} 
        onNodeClick={handleNodeClick} 
        isHighlighted={highlightedPaths.includes(props.data.path)}
      />
    )
  };

  // Track if this is the first render and previous orientation
  const isFirstRender = useRef(true);
  const prevOrientation = useRef(orientation);

  // Transform JSON data to React Flow nodes and edges
  useEffect(() => {
    if (jsonData) {
      const { nodes: newNodes, edges: newEdges } = transformJsonToFlow(jsonData, collapsedNodes);
      
      // Always use horizontal orientation
      setNodes(newNodes);
      setEdges(newEdges);
      
      // Only fit view on first render or orientation change, not when collapsing/expanding nodes
      const orientationChanged = prevOrientation.current !== orientation;
      
      if (isFirstRender.current || orientationChanged) {
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
          isFirstRender.current = false;
          prevOrientation.current = orientation;
        }, 100);
      }
    }
  }, [jsonData, collapsedNodes, orientation, reactFlowInstance]);

  // Handle search term changes
  useEffect(() => {
    if (searchTerm && nodes.length > 0) {
      const matchingPaths = findNodes(nodes, searchTerm);
      setHighlightedPaths(matchingPaths);
      
      // If matches found, zoom to the first match
      if (matchingPaths.length > 0) {
        const matchedNode = nodes.find(node => node.data.path === matchingPaths[0]);
        if (matchedNode) {
          reactFlowInstance.setCenter(matchedNode.position.x, matchedNode.position.y, { zoom: 1.5, duration: 800 });
        }
      }
    } else {
      setHighlightedPaths([]);
    }
  }, [searchTerm, nodes, reactFlowInstance]);

  // Handle node click to collapse/expand
  const handleNodeClick = useCallback((path: string) => {
    console.log('Node clicked:', path);
    setCollapsedNodes(prevState => {
      const newState = toggleNodeCollapse(path, prevState);
      console.log('New collapsed state:', newState);
      return newState;
    });
  }, []);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setCollapsedNodes(collapseAllNodes(nodes));
  }, [nodes]);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(expandAllNodes());
  }, []);

  // Export as PNG
  const exportAsPng = useCallback(() => {
    if (reactFlowWrapper.current) {
      toPng(reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: '#ffffff',
        quality: 1
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'json-visualization.png';
          link.href = dataUrl;
          link.click();
        });
    }
  }, []);

  // Export as SVG
  const exportAsSvg = useCallback(() => {
    if (reactFlowWrapper.current) {
      toSvg(reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: '#ffffff'
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'json-visualization.svg';
          link.href = dataUrl;
          link.click();
        });
    }
  }, []);

  // Default flow options for JSONCrack-like appearance
  const defaultEdgeOptions = {
    type: 'bezier',
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#94a3b8',
      width: 8,
      height: 8
    }
  };

  return (
    <div className="json-visualizer" style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
      <div ref={reactFlowWrapper} style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineType={ConnectionLineType.SmoothStep}
          minZoom={0.05}
          maxZoom={2.0}
          defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
          proOptions={{ hideAttribution: true }}
          connectionMode={ConnectionMode.Loose}
          zoomOnScroll={true}
          panOnScroll={true}
          nodesDraggable={false}
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background
            color="#f1f5f9"
            gap={24}
            size={1}
            style={{ backgroundColor: '#ffffff' }}
            variant={BackgroundVariant.Dots}
          />
          <Controls />
          
          <Panel position="top-right">
            <div className="control-buttons">
              <button onClick={handleCollapseAll}>Collapse All</button>
              <button onClick={handleExpandAll}>Expand All</button>
              <button onClick={exportAsPng}>Export as PNG</button>
              <button onClick={exportAsSvg}>Export as SVG</button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider
const JsonVisualizerWrapper: React.FC<JsonVisualizerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <JsonVisualizer {...props} />
    </ReactFlowProvider>
  );
};

export default JsonVisualizerWrapper;
