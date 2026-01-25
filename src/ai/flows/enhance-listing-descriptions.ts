'use server';

/**
 * @fileOverview AI-powered tool to enhance listing descriptions.
 *
 * - enhanceListingDescription - A function that enhances the listing description using AI.
 * - EnhanceListingDescriptionInput - The input type for the enhanceListingDescription function.
 * - EnhanceListingDescriptionOutput - The return type for the enhanceListingDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceListingDescriptionInputSchema = z.object({
  category: z.string().describe('The category of the listing item.'),
  specs: z.record(z.string()).describe('The specifications of the listing item as a key-value pair.'),
  existingDescription: z.string().describe('The existing description of the listing item.'),
});
export type EnhanceListingDescriptionInput = z.infer<typeof EnhanceListingDescriptionInputSchema>;

const EnhanceListingDescriptionOutputSchema = z.object({
  enhancedDescription: z.string().describe('The enhanced description of the listing item.'),
});
export type EnhanceListingDescriptionOutput = z.infer<typeof EnhanceListingDescriptionOutputSchema>;

export async function enhanceListingDescription(
  input: EnhanceListingDescriptionInput
): Promise<EnhanceListingDescriptionOutput> {
  return enhanceListingDescriptionFlow(input);
}

const enhanceListingDescriptionPrompt = ai.definePrompt({
  name: 'enhanceListingDescriptionPrompt',
  input: {schema: EnhanceListingDescriptionInputSchema},
  output: {schema: EnhanceListingDescriptionOutputSchema},
  prompt: `You are an expert copywriter specializing in writing compelling product descriptions for a B2B marketplace.

  You will be provided with the following information about a listing item:
  - Category: {{{category}}}
  - Specs: {{#each specs}}{{{@key}}}: {{{this}}}, {{/each}}
  - Existing Description: {{{existingDescription}}}

  Your goal is to enhance the existing description to make it more engaging and informative for potential buyers.
  Incorporate relevant details from the category and specs to highlight the key benefits and features of the item.
  Focus on improving user engagement and conversion rates by creating a description that is both accurate and persuasive.
  Make sure the enhanced description is not longer than 200 words.
  Enhanced Description:`, // Ensure the output matches the schema
});

const enhanceListingDescriptionFlow = ai.defineFlow(
  {
    name: 'enhanceListingDescriptionFlow',
    inputSchema: EnhanceListingDescriptionInputSchema,
    outputSchema: EnhanceListingDescriptionOutputSchema,
  },
  async input => {
    const {output} = await enhanceListingDescriptionPrompt(input);
    return output!;
  }
);
