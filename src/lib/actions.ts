'use server';

import { enhanceListingDescription } from '@/ai/flows/enhance-listing-descriptions';
import { z } from 'zod';

const enhanceDescriptionSchema = z.object({
  category: z.string(),
  specs: z.record(z.string()),
  existingDescription: z.string(),
});

export async function enhanceWithAI(
  prevState: any,
  formData: FormData
) {
    const rawData = {
        category: formData.get('category'),
        specs: JSON.parse(formData.get('specs') as string || '{}'),
        existingDescription: formData.get('existingDescription'),
    };
    
    const parsed = enhanceDescriptionSchema.safeParse(rawData);
    
    if (!parsed.success) {
        return { message: 'Invalid input for AI enhancement.', enhancedDescription: null, error: parsed.error.flatten() };
    }
    
    try {
        const result = await enhanceListingDescription(parsed.data);
        return { message: 'Description enhanced successfully!', enhancedDescription: result.enhancedDescription, error: null };
    } catch (e: any) {
        return { message: 'Failed to enhance description.', enhancedDescription: null, error: e.message };
    }
}
