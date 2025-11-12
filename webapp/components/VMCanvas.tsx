'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/system';
import '@xyflow/react/dist/style.css';
import VMNode from './VMNode';
import { VMConfiguration, NodeData, PredefinedMachine } from '@/types/vm';
import { createMachine, updateMachineConfig, deleteMachineById } from '@/lib/api-client';

const nodeTypes = {
  vmNode: VMNode,
};

export default function VMCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const nodeIdCounter = useRef(0);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const createVMNode = async (config: Partial<VMConfiguration>, position: { x: number; y: number }): Promise<Node<NodeData>> => {
    const id = `vm-${Date.now()}-${nodeIdCounter.current++}`;

    const vmConfig: VMConfiguration = {
      id,
      name: config.name || 'New VM',
      region: config.region || 'us-east-1',
      instanceSize: config.instanceSize || 't3.small',
      application: config.application || 'none',
      isDeployed: false,
      deploymentStatus: 'pending',
    };

    // Save to storage
    try {
      await createMachine(vmConfig);
    } catch (error) {
      console.error('Failed to save machine:', error);
    }

    return {
      id,
      type: 'vmNode',
      position,
      data: {
        ...vmConfig,
        onDeploy: handleDeploy,
        onDelete: handleDelete,
        onChange: handleNodeChange,
      },
    };
  };

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;

      const machine: PredefinedMachine = JSON.parse(data);

      if (reactFlowInstance && reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = await createVMNode(machine, position);
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, setNodes]
  );

  const handleCreateCustomMachine = useCallback(
    async (config: Partial<VMConfiguration>) => {
      // Place in center of viewport
      const position = reactFlowInstance
        ? reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          })
        : { x: 400, y: 200 };

      const newNode = await createVMNode(config, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleNodeChange = useCallback(
    async (nodeId: string, changes: Partial<VMConfiguration>) => {
      // Update in storage
      try {
        await updateMachineConfig(nodeId, changes);
      } catch (error) {
        console.error('Failed to update machine:', error);
      }

      // Update in UI
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...changes,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const handleDeploy = useCallback(
    async (nodeId: string) => {
      // Update status to deploying
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                deploymentStatus: 'deploying',
              },
            };
          }
          return node;
        })
      );

      try {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const response = await fetch('/api/deploy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vmConfig: node.data,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Update to deployed
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === nodeId) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    isDeployed: true,
                    deploymentStatus: 'deployed',
                    publicIp: result.publicIp,
                    sshKeyName: result.sshKeyName,
                  },
                };
              }
              return n;
            })
          );
        } else {
          // Update to failed
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === nodeId) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    deploymentStatus: 'failed',
                  },
                };
              }
              return n;
            })
          );
        }
      } catch (error) {
        console.error('Deployment error:', error);
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === nodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  deploymentStatus: 'failed',
                },
              };
            }
            return n;
          })
        );
      }
    },
    [nodes, setNodes]
  );

  const handleDelete = useCallback(
    async (nodeId: string) => {
      // Delete from storage
      try {
        await deleteMachineById(nodeId);
      } catch (error) {
        console.error('Failed to delete machine:', error);
      }

      // Delete from UI
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  return {
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
  };
}
