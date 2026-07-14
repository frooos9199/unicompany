export type UserRole = 'individual' | 'company' | 'admin' | 'superadmin';

export type AdminPermission =
  | 'manage_users'
  | 'manage_companies'
  | 'manage_admins'
  | 'view_analytics'
  | 'manage_content'
  | 'view_logs';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatar?: string;
  hasCv?: boolean;
  country?: string;
  city?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  isActive: boolean;
  language: 'ar' | 'en';
}

export interface IndividualProfile extends UserProfile {
  role: 'individual';
  firstName: string;
  lastName: string;
  title?: string;
  titleAr?: string;
  specialization?: string;
  specializationAr?: string;
  skills: string[];
  experienceYears?: number;
  bio?: string;
  bioAr?: string;
  cvFile?: string;
  cvData?: CVData;
  cvVisibility: 'private' | 'request_only' | 'public';
}

export interface CVData {
  education: Education[];
  experience: Experience[];
  skills: string[];
  languages: string[];
  languagesAr?: string[];
  certifications: string[];
  certificationsAr?: string[];
}

export interface CVProfile {
  userId: string;
  cvVisibility: 'private' | 'request_only' | 'public';
  cvFile?: string;
  cvData?: CVData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Education {
  institution: string;
  institutionAr?: string;
  degree: string;
  degreeAr?: string;
  field: string;
  fieldAr?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Experience {
  company: string;
  companyAr?: string;
  position: string;
  positionAr?: string;
  description: string;
  descriptionAr?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface CompanyProfile extends UserProfile {
  role: 'company';
  companyName: string;
  companyNameAr?: string;
  commercialRegistration: string;
  description?: string;
  descriptionAr?: string;
  services: string[];
  servicesAr?: string[];
  projects: Project[];
  teamMembers: TeamMember[];
  contactInfo: ContactInfo;
  industry?: string;
  industryAr?: string;
  website?: string;
  foundedYear?: number;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
}

export interface Project {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  image?: string;
  link?: string;
  year: number;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  avatar?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface CVRequest {
  id: string;
  companyId: string;
  companyName?: string;
  individualId: string;
  individualName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  message?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames?: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'cv_request' | 'cv_approved' | 'cv_rejected' | 'new_message' | 'new_application' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, string>;
}

export interface AdminUser extends UserProfile {
  role: 'admin' | 'superadmin';
  permissions: AdminPermission[];
}

export type AppUser = UserProfile &
  Partial<Omit<IndividualProfile, keyof UserProfile | 'role'>> &
  Partial<Omit<CompanyProfile, keyof UserProfile | 'role'>> & {
    permissions?: AdminPermission[];
  };

export interface Job {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  companyId: string;
  companyName: string;
  companyAvatar?: string;
  country: string;
  city?: string;
  type: 'full-time' | 'part-time' | 'remote' | 'contract' | 'freelance';
  salary?: string;
  requirements: string[];
  status: 'active' | 'closed';
  createdAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  companyId?: string;
  applicantId: string;
  applicantName: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}
