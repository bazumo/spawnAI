'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Resource } from '@/types/vm';
import { Database, UserCircle, FolderGit, Server } from 'lucide-react';

const getResourceIcon = (type: Resource['type']) => {
  switch (type) {
    case 'database':
      return Database;
    case 'account':
      return UserCircle;
    case 'project':
      return FolderGit;
    default:
      return Server;
  }
};

interface ResourceNodeProps {
  data: Resource;
  id: string;
}

function ResourceNode({ data }: ResourceNodeProps) {
  const IconComponent = getResourceIcon(data.type);

  return (
    <div className="min-w-[200px] rounded-lg border-2 border-black bg-white p-4 shadow-sm">
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-black" />

      <div className="flex items-start gap-3">
        <IconComponent className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-black text-sm">{data.name}</h3>
          {data.description && (
            <p className="text-xs text-gray-600 mt-1">{data.description}</p>
          )}
          <div className="mt-2">
            <span className="px-2 py-0.5 bg-white border border-black rounded text-black text-xs">
              {data.type}
            </span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-black" />
    </div>
  );
}

export default memo(ResourceNode);
