export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'caster' | 'observer';
  avatar?: string;
}

export interface TimeSlot {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'busy' | 'off';
  notes?: string;
}

export interface AvailabilityData {
  [staffId: string]: TimeSlot[];
}

export interface Stream {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  streamLink?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamAssignment {
  id: string;
  streamId: string;
  staffId: string;
  role: 'caster' | 'observer';
  isPrimary: boolean;
  createdAt: string;
}

export interface StreamRSVP {
  id: string;
  streamId: string;
  staffId: string;
  status: 'attending' | 'not_attending' | 'maybe';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamWithDetails extends Stream {
  assignments: StreamAssignment[];
  rsvps: StreamRSVP[];
}

export interface StaffCredits {
  id: string;
  staffId: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  staffId: string;
  streamId?: string;
  spaceId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceWithStats extends Space {
  memberCount: number;
  ownerName: string;
}

export interface SpaceMembership {
  id: string;
  spaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'caster' | 'observer';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  id: string;
  spaceId: string;
  userId: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'caster' | 'observer' | 'admin'; // Add role for pending requests
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequestWithUser extends JoinRequest {
  userName: string;
  userEmail: string;
}

export interface DiscordWebhook {
  id: string;
  spaceId: string;
  webhookUrl: string;
  webhookName?: string;
  isActive: boolean;
  autoPostStreams: boolean;
  postTiming: 'on_creation' | 'before_stream' | 'both';
  minutesBefore: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamDiscordPost {
  id: string;
  streamId: string;
  webhookId: string;
  discordMessageId?: string;
  postType: 'creation' | 'reminder';
  postedAt: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface SpaceAsset {
  id: string;
  spaceId: string;
  assetType: 'logo' | 'banner';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}