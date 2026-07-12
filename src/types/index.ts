export type UserRole = 'individual' | 'company' | 'admin' | 'superadmin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatar?: string;
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
  specialization?: string;
  skills: string[];
  experienceYears?: number;
  bio?: string;
  cvFile?: string;
  cvData?: CVData;
  cvVisibility: 'private';
}

export interface CVData {
  education: Education[];
  experience: Experience[];
  skills: string[];
  languages: string[];
  certifications: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Experience {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface CompanyProfile extends UserProfile {
  role: 'company';
  companyName: string;
  commercialRegistration: string;
  description?: string;
  services: string[];
  projects: Project[];
  teamMembers: TeamMember[];
  contactInfo: ContactInfo;
  industry?: string;
  website?: string;
  foundedYear?: number;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
}

export interface Project {
  id: string;
  title: string;
  description: string;
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
  individualId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
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
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'cv_request' | 'cv_approved' | 'cv_rejected' | 'new_message' | 'system';
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

export type AdminPermission =
  | 'manage_users'
  | 'manage_companies'
  | 'manage_admins'
  | 'view_analytics'
  | 'manage_content'
  | 'view_logs';
