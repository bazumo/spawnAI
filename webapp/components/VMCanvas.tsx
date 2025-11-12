'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import VMNode from './VMNode';
import ResourceNode from './ResourceNode';
import { VMConfiguration, NodeData, PredefinedMachine, Resource } from '@/types/vm';
import { createMachine, updateMachineConfig, deleteMachineById } from '@/lib/api-client';

// Type helpers for ReactFlow nodes and edges
type Node<T = any> = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: T;
};

type Edge = {
  id: string;
  source: string;
  target: string;
};

type Connection = {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

const nodeTypes = {
  vmNode: VMNode,
  resourceNode: ResourceNode,
};

export default function VMCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const nodeIdCounter = useRef(0);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
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

      const droppedData = JSON.parse(data);

      if (reactFlowInstance && reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Check if it's a resource or a machine
        if (droppedData.isResource) {
          // Create resource node
          const resource: Resource = droppedData;
          const id = `resource-${Date.now()}-${nodeIdCounter.current++}`;

          const newNode: Node<Resource> = {
            id,
            type: 'resourceNode',
            position,
            data: {
              id: resource.id,
              name: resource.name,
              type: resource.type,
              description: resource.description,
            },
          };

          setNodes((nds: Node<any>[]) => nds.concat(newNode));
        } else {
          // Create VM node
          const machine: PredefinedMachine = droppedData;
          const newNode = await createVMNode(machine, position);
          setNodes((nds: Node<NodeData>[]) => nds.concat(newNode));
        }
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
      setNodes((nds: Node<NodeData>[]) => nds.concat(newNode));
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
      setNodes((nds: Node<NodeData>[]) =>
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
      console.log('🎬 Deploy button clicked for node:', nodeId);

      // Get node data and update status to deploying
      let nodeData: NodeData | null = null;

      setNodes((nds: Node<NodeData>[]) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Capture the node data before deploying
            nodeData = node.data;
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

      console.log('✅ UI updated to deploying status');

      if (!nodeData) {
        console.error('❌ Node not found:', nodeId);
        console.log('📊 Available nodes:', nodes.map((n: Node<NodeData>) => ({ id: n.id, name: n.data.name })));
        return;
      }

      try {
        console.log('📦 Node data:', nodeData);
        console.log('🚀 Sending deployment request to /api/deploy...');

        const response = await fetch('/api/deploy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vmConfig: nodeData,
          }),
        });

        console.log('📡 Response status:', response.status);

        const result = await response.json();
        console.log('📥 Response data:', result);

        if (result.success) {
          console.log('✅ Deployment successful!');
          console.log('🌐 Public IP:', result.publicIp);
          console.log('🔑 SSH Key:', result.sshKeyName);

          // Update to deployed
          setNodes((nds: Node<NodeData>[]) =>
            nds.map((n: Node<NodeData>) => {
              if (n.id === nodeId) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    isDeployed: true,
                    deploymentStatus: 'deployed',
                    publicIp: result.publicIp,
                    sshKeyName: result.sshKeyName,
                    deploymentDir: result.deploymentDir,
                    sshCommand: result.sshCommand,
                  },
                };
              }
              return n;
            })
          );

          console.log('🎉 UI updated to deployed status');
        } else {
          console.error('❌ Deployment failed:', result.error);

          // Update to failed
          setNodes((nds: Node<NodeData>[]) =>
            nds.map((n: Node<NodeData>) => {
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

          console.log('⚠️ UI updated to failed status');
        }
      } catch (error) {
        console.error('❌ Deployment exception:', error);

        setNodes((nds: Node<NodeData>[]) =>
          nds.map((n: Node<NodeData>) => {
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

        console.log('⚠️ UI updated to failed status due to exception');
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
      setNodes((nds: Node<NodeData>[]) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds: Edge[]) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
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
