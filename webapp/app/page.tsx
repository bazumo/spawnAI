'use client';

import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Sidebar from '@/components/Sidebar';
import VMCanvas from '@/components/VMCanvas';

export default function Home() {
  const {
    reactFlowWrapper,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
    setReactFlowInstance,
    nodeTypes,
    handleCreateCustomMachine,
  } = VMCanvas();

  return (
    <div className="flex h-screen bg-white">
      <Sidebar onCreateCustomMachine={handleCreateCustomMachine} />

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-white"
        >
          <Background variant="dots" gap={16} size={1} color="#d3d3d3" />
        </ReactFlow>
      </div>
    </div>
  );
}
