import type {
  CategoryYearDetail,
  SpendCategorySummary,
  SavingsOpportunity,
  TenantMaster,
  VendorPriceRank,
  VendorYearDetail
} from './models';

export interface TenantApiResponse {
  success?: boolean;
  data?: TenantMaster;
  message?: string;
}

export interface CategoryDetailsApiData {
  categoryDetails: CategoryYearDetail[];
}

export interface VendorDetailsApiData {
  vendorDetails: VendorYearDetail[];
}

export interface CategoriesApiData {
  categories: SpendCategorySummary[];
  categoryDetails: CategoryYearDetail[];
}

export interface VendorsApiData {
  vendorRankings: VendorPriceRank[];
  vendorDetails: VendorYearDetail[];
}

export interface SavingsOpportunitiesApiData {
  opportunities: SavingsOpportunity[];
  totalPotentialSavingsCr: number;
}
