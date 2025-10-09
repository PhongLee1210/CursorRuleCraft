/**
 * SEO Configuration and Utilities
 * Centralized SEO constants and helper functions
 */

export const SEO_CONFIG = {
  siteName: 'CursorRulesCraft',
  siteUrl: 'https://cursorrulescraft.com',
  defaultTitle: 'CursorRulesCraft - Craft Perfect Rules for Your Cursor AI Projects',
  defaultDescription:
    'Create, customize, and manage intelligent rules for Cursor AI editor. Enhance your coding workflow with pre-built templates and smart project configurations.',
  defaultKeywords:
    'cursor ai, cursor rules, cursor editor, ai coding, code editor rules, cursor templates, ai development, cursor configuration',
  defaultImage: 'https://cursorrulescraft.com/logo/cursorrulescraft.png',
  twitterHandle: '@cursorrulescraft', // Update with your actual Twitter handle
  facebookAppId: '', // Add your Facebook App ID if you have one
} as const;

/**
 * Generates a full URL from a path
 * @param path - The path to append to the site URL
 * @returns Full URL
 */
export function getFullUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

/**
 * Generates a full title with the site name
 * @param pageTitle - The page-specific title
 * @returns Full title with site name
 */
export function getFullTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${SEO_CONFIG.siteName}` : SEO_CONFIG.defaultTitle;
}

/**
 * Page-specific SEO configurations
 * Use these for consistent SEO across similar pages
 */
export const PAGE_SEO = {
  home: {
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    url: SEO_CONFIG.siteUrl,
  },
  login: {
    title: 'Login',
    description: `Sign in to your ${SEO_CONFIG.siteName} account to manage your cursor rules and projects.`,
    url: getFullUrl('/auth/login'),
    noindex: true,
  },
  register: {
    title: 'Register',
    description: `Create a ${SEO_CONFIG.siteName} account to start building and sharing cursor rules.`,
    url: getFullUrl('/auth/register'),
    noindex: true,
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Manage your cursor rules, projects, and settings.',
    url: getFullUrl('/dashboard'),
    noindex: true,
  },
} as const;

/**
 * Generates structured data (JSON-LD) for different page types
 */
export const generateStructuredData = {
  /**
   * Website structured data
   */
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SEO_CONFIG.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }),

  /**
   * Organization structured data
   */
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: SEO_CONFIG.defaultImage,
    sameAs: [
      // Add your social media URLs here
      // 'https://twitter.com/cursorrulescraft',
      // 'https://github.com/cursorrulescraft',
    ],
  }),

  /**
   * Article structured data
   * @param title - Article title
   * @param description - Article description
   * @param url - Article URL
   * @param imageUrl - Article image URL
   * @param datePublished - ISO date string
   * @param dateModified - ISO date string
   * @param authorName - Author name
   */
  article: (params: {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    datePublished: string;
    dateModified?: string;
    authorName?: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    image: params.imageUrl || SEO_CONFIG.defaultImage,
    author: {
      '@type': 'Person',
      name: params.authorName || SEO_CONFIG.siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: SEO_CONFIG.defaultImage,
      },
    },
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
  }),

  /**
   * Breadcrumb structured data
   * @param items - Array of breadcrumb items with name and url
   */
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};
