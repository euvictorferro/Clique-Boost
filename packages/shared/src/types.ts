export type Niche = 'life-insurance' | 'real-estate' | 'general';

export type ClientStatus = 'onboarding' | 'active' | 'paused';

export type PaymentStatus = 'pending' | 'proof_submitted' | 'confirmed' | 'overdue';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  includesOrganic: boolean;
  includesPaidAds: boolean;
  includesVideo: boolean;
  monthlyPrice?: number;
  trackedMetrics: string[];
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  brandName: string;
  niche: Niche;
  instagramHandle?: string;
  competitors: string[];
  socialNetworks: string[];
  toneOfVoice: string;
  contentGoal: string;
  hasVisualIdentity: boolean;
  brandColors?: string;
  obsidianPath: string;
  trelloBoardId?: string;
  boardId?: string;
  metaAccessToken?: string;
  metaTokenExpiresAt?: string;
  adAccountId?: string;
  supabaseUserId?: string;
  createdAt: string;
  status: ClientStatus;
  profilePictureUrl?: string;
  planId?: string;
  paymentStatus?: PaymentStatus;
  paymentProofUrl?: string;
  paymentConfirmedAt?: string;
}

export interface BriefingResponse {
  clientName: string;
  brandName: string;
  niche: Niche;
  city: string;
  instagramHandle?: string;
  idealClient: string;
  differentials: string;
  hasVisualIdentity: boolean;
  brandColors?: string;
  socialNetworks: string[];
  competitors: string[];
  toneOfVoice: string;
  contentGoal: string;
  // campos específicos life-insurance
  insuranceProducts?: string[];
  targetAudience?: string;
  clientObjection?: string;
  successCases?: string;
  // campos específicos real-estate
  propertyType?: string[];
  priceRange?: string;
  workModel?: string;
  builderPartners?: string;
  buyerFear?: string;
  hasMediaAssets?: string;
  rawData: Record<string, string>;
}

export interface ContentPost {
  week: number;
  day: number;
  date: string;
  theme: string;
  format: 'Reel' | 'Carrossel' | 'Stories' | 'TikTok';
  platforms: string[];
  hook: string;
  objective: string;
  rationale?: string;
  storiesIdea?: string;
  notes?: string;
}

export interface ContentCalendar {
  clientId: string;
  month: string;
  posts: ContentPost[];
  generatedAt: string;
}

export interface PaletteColor {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background';
}

export interface ColorPalette {
  index: number;
  suggestedName: string;
  colors: PaletteColor[];
}

export interface PaletteResult {
  clientId: string;
  hasExistingIdentity: boolean;
  existingColors?: string;
  generatedPalettes?: ColorPalette[];
}

export interface MetaDemographics {
  ageRanges: Array<{ range: string; percentage: number }>;
  topCities: Array<{ city: string; percentage: number }>;
  genderSplit: { male: number; female: number; unknown: number };
}

export interface MetaInsights {
  clientId: string;
  period: string;
  reach: number;
  impressions: number;
  engagementRate: number;
  followerCount: number;
  followerGrowth: number;
  topPosts: MetaPost[];
  demographics?: MetaDemographics;
  dailyFollowers?: Array<{ date: string; followers: number }>;
  profilePictureUrl?: string;
  fetchedAt?: string;
}

export interface InstagramPost {
  videoUrl?: string;
  url: string;
  videoPlayCount?: number;
  likesCount: number;
  commentsCount: number;
  ownerUsername: string;
  timestamp: string;
  caption?: string;
  type?: string;
}

export type CardStatus = 'draft' | 'pending' | 'approved' | 'published';
export type CardFormat = 'Reel' | 'Carrossel' | 'Stories' | 'TikTok';

export interface KanbanCard {
  id: string;
  columnId: string;
  boardId: string;
  position: number;
  title: string;
  week?: number;
  day?: number;
  date?: string;
  theme?: string;
  format?: CardFormat;
  platforms: string[];
  hook?: string;
  caption?: string;
  hashtags?: string;
  objective?: string;
  rationale?: string;
  storiesIdea?: string;
  notes?: string;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  cards: KanbanCard[];
}

export interface Board {
  id: string;
  clientId: string;
  name: string;
  columns: BoardColumn[];
  createdAt: string;
}

export interface MetaPost {
  id: string;
  permalink: string;
  mediaType: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  caption?: string;
  thumbnailUrl?: string;
}
