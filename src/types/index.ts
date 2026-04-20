export interface Admin {
  id: string;
  email: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "vendor" | "rider" | "customer" | "admin";
  isActive: boolean;
  emailVerified: boolean;
  isOtonavRecommended?: boolean;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  organizations?: UserOrg[];
}

export interface UserOrg {
  orgId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  orgName: string;
}

export interface Organization {
  id: string;
  name: string;
  address?: string;
  subscriptionPlan?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCounts?: { role: string; count: number }[];
  members?: OrgMember[];
  ordersCount?: number;
}

export interface OrgMember {
  userId: string;
  role: string;
  isActive: boolean;
  isSuspended: boolean;
  joinedAt: string;
  userEmail: string;
  userName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  createdAt: string;
  deliveredAt?: string;
  orgName?: string;
  customerName?: string;
  customerEmail?: string;
  orgId?: string;
  customerId?: string;
  riderId?: string;
  customer?: User;
  organization?: Organization;
  rider?: User;
  waitlistEntry?: WaitlistEntry;
}

export interface VerifiedRider {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  isOtonavRecommended: boolean;
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalAssignments: number;
    completedAssignments: number;
  };
}

export interface WaitlistEntry {
  id: string;
  orderId: string;
  status: "pending" | "assigned" | "completed";
  position: number;
  createdAt: string;
  assignedAt?: string;
  orderNumber: string;
  orgName: string;
  vendorName: string;
  vendorEmail: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalOrders: number;
  pendingOrders: number;
  verifiedRiders: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  orgName: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}
