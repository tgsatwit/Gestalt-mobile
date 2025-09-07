export interface Specialist {
  id: string;
  name: string;
  title: string; // e.g., "Speech-Language Pathologist", "Occupational Therapist"
  organization?: string; // Clinic, hospital, private practice name
  email?: string;
  phone?: string;
  address?: string;
  specialties?: string[]; // e.g., ["Autism", "ADHD", "Language Delays"]
  notes?: string;
  userId: string; // Link to user who created this specialist
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpecialistData {
  name: string;
  title: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
  specialties?: string[];
  notes?: string;
}

export interface UpdateSpecialistData extends Partial<CreateSpecialistData> {}

// Many-to-many relationship between children and specialists
export interface ChildSpecialistLink {
  id: string;
  childId: string;
  specialistId: string;
  relationshipType: 'current' | 'past' | 'scheduled'; // Current provider, past provider, or scheduled appointment
  startDate?: string; // ISO string
  endDate?: string; // ISO string - null if current
  notes?: string; // Relationship-specific notes
  userId: string; // User who created this link
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChildSpecialistLinkData {
  childId: string;
  specialistId: string;
  relationshipType: 'current' | 'past' | 'scheduled';
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateChildSpecialistLinkData extends Partial<CreateChildSpecialistLinkData> {}

// Composite view for displaying specialists with relationship info
export interface ChildSpecialistView extends Specialist {
  relationship?: ChildSpecialistLink;
}