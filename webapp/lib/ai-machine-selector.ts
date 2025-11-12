'use server';

import Anthropic from '@anthropic-ai/sdk';
import { predefinedMachines } from './predefined-machines';
import { PredefinedMachine } from '@/types/vm';
import { getRegionDisplayName } from './regions';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function selectBestMachine(userPrompt: string): Promise<PredefinedMachine> {
  // Format the predefined machines for the AI prompt
  const machinesDescription = predefinedMachines
    .map((machine, index) => {
      return `${index + 1}. ${machine.name}
   - Description: ${machine.description}
   - Region: ${getRegionDisplayName(machine.region)} (${machine.region})
   - Instance Size: ${machine.instanceSize}
   - Application: ${machine.application === 'none' ? 'No application' : machine.application}`;
    })
    .join('\n\n');

  const prompt = `You are an expert system administrator helping users select the best VM configuration for their needs.

Here are the available predefined machine configurations:

${machinesDescription}

The user has requested: "${userPrompt}"

Based on the user's request, select the BEST matching machine from the list above. Consider:
- The user's stated requirements and use case
- Geographic location preferences (if mentioned)
- Performance needs (instance size)
- Specific applications they need

Respond with ONLY the number (1, 2, etc.) of the best matching machine. No explanation needed.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    const selectedIndex = parseInt(response.text.trim()) - 1;

    if (selectedIndex >= 0 && selectedIndex < predefinedMachines.length) {
      return predefinedMachines[selectedIndex];
    } else {
      // Fallback to first machine if AI returns invalid index
      console.warn('AI returned invalid machine index, using default');
      return predefinedMachines[0];
    }
  } catch (error) {
    console.error('Error selecting machine with AI:', error);
    // Fallback to first machine on error
    return predefinedMachines[0];
  }
}
