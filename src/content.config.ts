import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const linkSchema = z.object({
  name: z.string(),
  url: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional()
});

const linksCollection = defineCollection({
  loader: glob({ pattern: 'links.yaml', base: './src/data' }),
  schema: z.object({
    navigation: z.array(
      z.object({
        category: z.string(),
        links: z.array(linkSchema).optional(),
        subcategories: z
          .array(
            z.object({
              name: z.string(),
              links: z.array(linkSchema)
            })
          )
          .optional()
      })
    )
  })
});

const searchCollection = defineCollection({
  loader: glob({ pattern: 'search.yaml', base: './src/data' }),
  schema: z.object({
    defaultSearchEngine: z.string().optional(),
    searchEngines: z
      .array(
        z.object({
          name: z.string(),
          displayName: z.string(),
          baseUrl: z.string(),
          queryParam: z.string(),
          icon: z.string(),
          placeholder: z.string()
        })
      )
      .optional(),
    searchConfig: z
      .object({
        defaultEngine: z.string().optional(),
        enabledEngines: z.array(z.string()).optional(),
        showEngineSelector: z.boolean().optional(),
        maxSuggestions: z.number().optional()
      })
      .optional()
  })
});

const seoCollection = defineCollection({
  loader: glob({ pattern: 'seo.yaml', base: './src/data' }),
  schema: z.object({
    seoConfig: z.object({
      siteName: z.string(),
      siteDescription: z.string(),
      siteUrl: z.string(),
      defaultTitle: z.string(),
      titleTemplate: z.string(),
      defaultImage: z.string(),
      twitterHandle: z.string(),
      author: z.string(),
      keywords: z.array(z.string()),
      language: z.string(),
      locale: z.string()
    })
  })
});

export const collections = {
  links: linksCollection,
  search: searchCollection,
  seo: seoCollection
};
