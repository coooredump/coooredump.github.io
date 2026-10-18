import { Icons } from '../libs/icons'

export type { IntegrationUserConfig } from './integrations-config'
export type { ThemeUserConfig } from './theme-config'
export type { UserInputConfig as Config, UserConfig as ConfigOutput } from './user-config'

export interface SiteMeta {
  title: string
  description?: string
  ogImage?: string | undefined
  articleDate?: string | undefined
  /** ISO date; used for JSON-LD datePublished */
  publishedDate?: string | undefined
  /** ISO date; used for JSON-LD dateModified */
  updatedDate?: string | undefined
  /** Article tags; used for JSON-LD keywords and article:tag */
  tags?: string[] | undefined
}

export type CardListData = {
  title: string
  list: CardList
}

export type CardList = {
  title: string
  link?: string
  children?: CardList
}[]

export type TimelineEvent = {
  date: string
  content: string
}

export type iconsType = keyof typeof Icons

export { socialLinks } from './constants'
