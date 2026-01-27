import { defineCollection } from 'astro:content';
import { docsLoader } from '@bablr/starlight/loaders';
import { docsSchema } from '@bablr/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
