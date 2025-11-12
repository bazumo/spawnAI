'use client';

import { useState } from 'react';
import { predefinedMachines } from '@/lib/predefined-machines';
import { predefinedResources } from '@/lib/predefined-resources';
import { PredefinedMachine, VMConfiguration, Resource } from '@/types/vm';
import { Server, Sparkles, Database, UserCircle, FolderGit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRegionDisplayName } from '@/lib/regions';
import { selectBestMachine } from '@/lib/ai-machine-selector';

interface SidebarProps {
  onCreateCustomMachine: (config: Partial<VMConfiguration>) => void;
}

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

export default function Sidebar({ onCreateCustomMachine }: SidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const onDragStart = (event: React.DragEvent, machine: PredefinedMachine) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(machine));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onResourceDragStart = (event: React.DragEvent, resource: Resource) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ ...resource, isResource: true }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleGenerateCustomMachine = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      // Use AI to select the best predefined machine based on user's prompt
      const selectedMachine = await selectBestMachine(prompt);

      const customConfig: Partial<VMConfiguration> = {
        name: prompt.slice(0, 50),
        region: selectedMachine.region,
        instanceSize: selectedMachine.instanceSize,
        application: selectedMachine.application,
      };

      onCreateCustomMachine(customConfig);
      setPrompt('');
    } catch (error) {
      console.error('Error generating custom machine:', error);
      // Fallback to simple parsing if AI fails
      const lower = prompt.toLowerCase();

      let region: VMConfiguration['region'] = 'us-east-1';
      let instanceSize: VMConfiguration['instanceSize'] = 't3.small';
      let application: VMConfiguration['application'] = 'none';

      // Parse region - support both codes and city names
      if (lower.includes('us-east-1') || lower.includes('us east 1') || lower.includes('virginia')) region = 'us-east-1';
      else if (lower.includes('us-west-1') || lower.includes('us west 1') || lower.includes('san francisco')) region = 'us-west-1';
      else if (lower.includes('eu-central') || lower.includes('frankfurt')) region = 'eu-central-1';
      else if (lower.includes('asia') || lower.includes('tokyo')) region = 'ap-northeast-1';

      // Parse instance size
      if (lower.includes('micro')) instanceSize = 't2.micro';
      else if (lower.includes('large')) instanceSize = 't3.large';

      // Parse application
      if (lower.includes('vscode') || lower.includes('vs code')) application = 'vscode';
      else if (lower.includes('claude')) application = 'claude-code';

      const customConfig: Partial<VMConfiguration> = {
        name: prompt.slice(0, 50),
        region,
        instanceSize,
        application,
      };

      onCreateCustomMachine(customConfig);
      setPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-black flex flex-col h-screen">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <img src="/logo_green.svg" alt="SpawnAI Logo" className="w-6 h-6" />
          <h2 className="text-xl font-bold text-black">SpawnAI</h2>
        </div>
      </div>

      {/* Predefined Machines */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          Machines
        </h3>
        <div className="space-y-2">
          {predefinedMachines.map((machine) => (
            <div
              key={machine.id}
              draggable
              onDragStart={(e) => onDragStart(e, machine)}
              className="p-3 bg-white border border-black cursor-move hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-start gap-2">
                <Server className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-black">
                    {machine.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{machine.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-2 py-0.5 bg-white border border-black text-black text-xs">
                      {getRegionDisplayName(machine.region)}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-black text-black text-xs">
                      {machine.instanceSize}
                    </span>
                    {machine.application !== 'none' && (
                      <span className="px-2 py-0.5 bg-black text-white text-xs">
                        {machine.application}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resources Section */}
        <h3 className="text-xs font-semibold text-gray-500 mb-3 mt-6 uppercase tracking-wide">
          Resources
        </h3>
        <div className="space-y-2">
          {predefinedResources.map((resource) => {
            const IconComponent = getResourceIcon(resource.type);
            return (
              <div
                key={resource.id}
                draggable
                onDragStart={(e) => onResourceDragStart(e, resource)}
                className="p-3 bg-white border border-black rounded-lg cursor-move hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <IconComponent className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-black">
                      {resource.name}
                    </h4>
                    {resource.description && (
                      <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-2 py-0.5 bg-white border border-black rounded text-black text-xs">
                        {resource.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Custom Machine Prompt */}
      <div className="p-4 border-t border-black">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-black mt-0.5" />
          <h3 className="text-sm font-semibold text-black">Generate configuration</h3>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Machine to vibe code in Tokyo with a big GPU"
          className="w-full px-3 py-2 bg-white border border-black text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black resize-none"
          rows={3}
        />
        <button
          onClick={handleGenerateCustomMachine}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            'w-full mt-2 px-4 py-2 text-sm font-medium transition-colors border',
            prompt.trim() && !isGenerating
              ? 'bg-black text-white border-black hover:bg-gray-900'
              : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
          )}
        >
          {isGenerating ? 'Generating...' : 'Generate Machine'}
        </button>
      </div>

    </div>
  );
}
