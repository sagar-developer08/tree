# JSON Visualizer & Editor

A React-based JSON visualization and editing tool similar to JSONCrack, allowing users to visualize JSON data as an interactive, collapsible node graph.

![JSON Visualizer Screenshot](screenshot.png)

## Features

- **Real-time JSON Editing**: Edit JSON in a Monaco Editor with syntax highlighting and validation
- **Interactive Visualization**: View JSON as a node-based graph with React Flow
- **Collapsible Nodes**: Click on any object or array node to collapse/expand its children
- **Search Functionality**: Search for keys or values within the JSON structure
- **Layout Options**: Switch between vertical and horizontal layouts
- **Export Options**: Export the visualization as PNG or SVG
- **Node Highlighting**: Highlight nodes that match search criteria
- **Collapse/Expand All**: Quickly collapse or expand all nodes

## Technologies Used

- React with TypeScript
- Monaco Editor for JSON editing
- React Flow for node-based visualization
- HTML-to-Image for export functionality

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Usage

1. Enter or paste JSON in the editor panel on the left
2. The visualization will update in real-time on the right
3. Click on object or array nodes to collapse/expand their children
4. Use the control panel to search, change layout, or export the visualization

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production

## License

MIT
