import { z } from 'astro/zod'

import { FriendLinksSchema } from '../schemas/links'

export const IntegrationConfigSchema = () =>
  z.object({
    links: FriendLinksSchema(),

    /**
     * Define whether default site search provider Pagefind is enabled.
     * Set to `false` to disable indexing your site with Pagefind.
     * This will also hide the default search UI if in use.
     */
    pagefind: z.boolean().optional(),

    /**
     * Add a random quote to the footer (default on homepage footer).
     * The quote will be fetched from the specified server and the target will be replaced with the quote.
     */
    quote: z.object({
      /** The server to fetch the quote from. */
      server: z.string(),
      /** target: string, but (data: unknown) => string */
      target: z.string()
    }),

    /** UnoCSS typography */
    typography: z.object({
      /** The class to apply to the typography. */
      class: z
        .string()
        .default('prose prose-pure dark:prose-invert dark:prose-pure prose-headings:font-medium'),
      /** The style of blockquote font, normal or italic. */
      blockquoteStyle: z.enum(['normal', 'italic']).default('italic'),
      /** The style of inline code block, code or modern. */
      inlineCodeBlockStyle: z.enum(['code', 'modern']).default('modern')
    }),

    /** A lightbox library that can add zoom effect */
    mediumZoom: z.object({
      /** Enable the medium zoom library. */
      enable: z.boolean().default(true),
      /** The selector to apply the zoom effect to. */
      selector: z.string().default('.prose .zoomable'),
      /** Options to pass to the medium zoom library. */
      options: z.record(z.string(), z.any()).default({ className: 'zoomable' })
    }),

    /** The Giscus comment system, backed by GitHub Discussions. */
    giscus: z.object({
      /** Enable the Giscus comment system. */
      enable: z.boolean().default(false),
      /** Public GitHub repository in owner/name form. */
      repo: z.string(),
      /** GitHub repository node ID (R_...). */
      repoId: z.string(),
      /** Discussion category name. */
      category: z.string(),
      /** Discussion category node ID (DIC_...). */
      categoryId: z.string(),
      /** How a page maps to a discussion. */
      mapping: z.enum(['pathname', 'url', 'title', 'og:title', 'specific']).default('pathname'),
      /** Use strict title matching. */
      strict: z.enum(['0', '1']).default('0'),
      /** Enable reactions on the discussion. */
      reactionsEnabled: z.enum(['0', '1']).default('1'),
      /** Place the comment box above or below the comments. */
      inputPosition: z.enum(['top', 'bottom']).default('bottom'),
      /** Giscus theme name, or preferred_color_scheme. */
      theme: z.string().default('preferred_color_scheme'),
      /** Giscus UI language. */
      lang: z.string().default('zh-CN')
    })
  })

export type IntegrationConfig = z.infer<ReturnType<typeof IntegrationConfigSchema>>
export type IntegrationUserConfig = z.input<ReturnType<typeof IntegrationConfigSchema>>
