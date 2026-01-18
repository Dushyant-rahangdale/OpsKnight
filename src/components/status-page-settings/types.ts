'use client';

// Shared types for Status Page Settings components

export type StatusPageData = {
  id: string;
  name: string;
  organizationName?: string | null;
  subdomain?: string | null;
  customDomain?: string | null;
  enabled: boolean;
  showServices: boolean;
  showIncidents: boolean;
  showMetrics: boolean;
  showSubscribe?: boolean;
  showServicesByRegion?: boolean;
  showServiceOwners?: boolean;
  showServiceSlaTier?: boolean;
  showChangelog?: boolean;
  showRegionHeatmap?: boolean;
  showPostIncidentReview?: boolean;
  enableUptimeExports?: boolean;
  statusApiRequireToken?: boolean;
  statusApiRateLimitEnabled?: boolean;
  statusApiRateLimitMax?: number;
  statusApiRateLimitWindowSec?: number;
  footerText?: string | null;
  contactEmail?: string | null;
  contactUrl?: string | null;
  emailProvider?: string | null;
  branding?: Record<string, unknown>;
  requireAuth?: boolean;
  privacyMode?: string;
  showIncidentDetails?: boolean;
  showIncidentTitles?: boolean;
  showIncidentDescriptions?: boolean;
  showAffectedServices?: boolean;
  showIncidentTimestamps?: boolean;
  showServiceMetrics?: boolean;
  showServiceDescriptions?: boolean;
  showServiceRegions?: boolean;
  showTeamInformation?: boolean;
  showCustomFields?: boolean;
  showIncidentAssignees?: boolean;
  showIncidentUrgency?: boolean;
  showUptimeHistory?: boolean;
  showRecentIncidents?: boolean;
  maxIncidentsToShow?: number;
  incidentHistoryDays?: number;
  allowedCustomFields?: string[];
  dataRetentionDays?: number | null;
  authProvider?: string | null;
  uptimeExcellentThreshold?: number;
  uptimeGoodThreshold?: number;
  services: StatusPageService[];
  announcements: Announcement[];
  apiTokens: ApiToken[];
};

export type StatusPageService = {
  id: string;
  serviceId: string;
  displayName?: string | null;
  showOnPage: boolean;
  order: number;
  service: {
    id: string;
    name: string;
    region?: string | null;
  };
};

export type Service = {
  id: string;
  name: string;
  region?: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  affectedServiceIds?: string[] | null;
};

export type ApiToken = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
};

export type FormData = {
  name: string;
  organizationName: string;
  subdomain: string;
  customDomain: string;
  enabled: boolean;
  requireAuth: boolean;
  showServices: boolean;
  showIncidents: boolean;
  showMetrics: boolean;
  showSubscribe: boolean;
  showServicesByRegion: boolean;
  uptimeExcellentThreshold: number;
  uptimeGoodThreshold: number;
  footerText: string;
  contactEmail: string;
  contactUrl: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  customCss: string;
  layout: string;
  showHeader: boolean;
  showFooter: boolean;
  metaTitle: string;
  metaDescription: string;
  autoRefresh: boolean;
  refreshInterval: number;
  showRssLink: boolean;
  showApiLink: boolean;
  showServiceOwners: boolean;
  showServiceSlaTier: boolean;
  showChangelog: boolean;
  showRegionHeatmap: boolean;
  showPostIncidentReview: boolean;
  enableUptimeExports: boolean;
  statusApiRequireToken: boolean;
  statusApiRateLimitEnabled: boolean;
  statusApiRateLimitMax: number;
  statusApiRateLimitWindowSec: number;
};

export type ServiceConfig = {
  displayName: string;
  order: number;
  showOnPage: boolean;
};

export type TemplateCategory = 'professional' | 'colorful' | 'dark' | 'pastel' | 'minimal';

export type StatusPageTemplate = {
  id: string;
  name: string;
  file: string;
  colors: string[];
  category: TemplateCategory;
};

export const ANNOUNCEMENT_TYPES = [
  { value: 'INCIDENT', label: 'Incident', color: '#ef4444', background: '#fee2e2' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: '#2563eb', background: '#dbeafe' },
  { value: 'UPDATE', label: 'Update', color: '#10b981', background: '#dcfce7' },
  { value: 'WARNING', label: 'Warning', color: '#f59e0b', background: '#fef3c7' },
  { value: 'INFO', label: 'Information', color: '#64748b', background: '#f1f5f9' },
];

export const TEMPLATE_FILTERS: Array<{ id: 'all' | TemplateCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'professional', label: 'Professional' },
  { id: 'colorful', label: 'Colorful' },
  { id: 'dark', label: 'Dark' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'minimal', label: 'Minimal' },
];

export const STATUS_PAGE_TEMPLATES: StatusPageTemplate[] = [
  // Professional
  {
    id: 'clean-white',
    name: 'Clean White',
    file: 'clean-white.css',
    colors: ['#2563eb', '#111827', '#ffffff'],
    category: 'professional',
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    file: 'corporate-blue.css',
    colors: ['#1d4ed8', '#0f172a', '#f8fafc'],
    category: 'professional',
  },
  {
    id: 'enterprise-gray',
    name: 'Enterprise Gray',
    file: 'enterprise-gray.css',
    colors: ['#111827', '#374151', '#f3f4f6'],
    category: 'professional',
  },
  {
    id: 'summit-teal',
    name: 'Summit Teal',
    file: 'summit-teal.css',
    colors: ['#0f766e', '#14b8a6', '#e6f7f5'],
    category: 'professional',
  },
  // Colorful
  {
    id: 'aurora-bright',
    name: 'Aurora Bright',
    file: 'aurora-bright.css',
    colors: ['#ff6a00', '#00c2ff', '#7c3aed'],
    category: 'colorful',
  },
  {
    id: 'ocean-glass',
    name: 'Ocean Glass',
    file: 'ocean-glass.css',
    colors: ['#0ea5e9', '#22d3ee', '#e0f2fe'],
    category: 'colorful',
  },
  {
    id: 'emerald-dawn',
    name: 'Emerald Dawn',
    file: 'emerald-dawn.css',
    colors: ['#10b981', '#84cc16', '#ecfdf5'],
    category: 'colorful',
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    file: 'coral-reef.css',
    colors: ['#f43f5e', '#14b8a6', '#f0fdfa'],
    category: 'colorful',
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    file: 'electric-blue.css',
    colors: ['#3b82f6', '#06b6d4', '#ecfeff'],
    category: 'colorful',
  },
  // Dark
  {
    id: 'midnight-neon',
    name: 'Midnight Neon',
    file: 'midnight-neon.css',
    colors: ['#22d3ee', '#a855f7', '#f472b6'],
    category: 'dark',
  },
  {
    id: 'arctic-night',
    name: 'Arctic Night',
    file: 'arctic-night.css',
    colors: ['#38bdf8', '#0f172a', '#111827'],
    category: 'dark',
  },
  {
    id: 'obsidian-ember',
    name: 'Obsidian Ember',
    file: 'obsidian-ember.css',
    colors: ['#111827', '#b45309', '#f97316'],
    category: 'dark',
  },
  {
    id: 'dark-nordic',
    name: 'Dark Nordic',
    file: 'dark-nordic.css',
    colors: ['#0b1321', '#2563eb', '#e0e7ff'],
    category: 'dark',
  },
  // Pastel
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    file: 'lavender-mist.css',
    colors: ['#a855f7', '#7c3aed', '#faf5ff'],
    category: 'pastel',
  },
  {
    id: 'glacier',
    name: 'Glacier',
    file: 'glacier.css',
    colors: ['#38bdf8', '#22d3ee', '#ecfeff'],
    category: 'pastel',
  },
  {
    id: 'blush-cream',
    name: 'Blush Cream',
    file: 'blush-cream.css',
    colors: ['#f472b6', '#fde68a', '#fdf2f8'],
    category: 'pastel',
  },
  {
    id: 'mint-lilac',
    name: 'Mint Lilac',
    file: 'mint-lilac.css',
    colors: ['#34d399', '#c084fc', '#faf5ff'],
    category: 'pastel',
  },
  // Minimal
  {
    id: 'graphite-gold',
    name: 'Graphite Gold',
    file: 'graphite-gold.css',
    colors: ['#111827', '#f59e0b', '#f9fafb'],
    category: 'minimal',
  },
  {
    id: 'monochrome-ink',
    name: 'Monochrome Ink',
    file: 'monochrome-ink.css',
    colors: ['#0f172a', '#334155', '#f3f4f6'],
    category: 'minimal',
  },
  {
    id: 'slate-mint',
    name: 'Slate Mint',
    file: 'slate-mint.css',
    colors: ['#334155', '#2dd4bf', '#f8fafc'],
    category: 'minimal',
  },
];
