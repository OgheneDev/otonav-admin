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
  orgId: string;
  packageDescription: string;
  customerId: string;
  riderId: string;
  riderCurrentLocation: string | null;
  customerLocationLabel: string | null;
  customerLocationPrecise: string | null;
  status:
    | "pending"
    | "rider_accepted"
    | "customer_location_set"
    | "confirmed"
    | "delivered"
    | "cancelled"
    | "in_transit"
    | "package_picked_up"
    | "arrived_at_location";
  assignedAt: string | null;
  riderAcceptedAt: string | null;
  customerLocationSetAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    email: string;
    name: string | null;
    phoneNumber: string;
  };
  rider?: {
    id: string;
    email: string;
    name: string | null;
    currentLocation: string | null;
    phoneNumber: string;
  };
  customerLat?: number;
  customerLng?: number;
  organization?: Organization;
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
