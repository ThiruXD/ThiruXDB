/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string | null;
  collection_name: string | null;
  id_field: string | null;
  base_url: string;
  auth_type: 'none' | 'api_key' | 'bearer' | 'basic';
  auth_config: Json;
  field_mappings: Json;
  response_path: string;
  pagination_type: 'none' | 'offset' | 'cursor' | 'page';
  pagination_config: Json;
  path_variables?: {
    variable: string;
    source_collection: string;
    source_field: string;
  }[];
  is_active: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataRecord {
  id: string;
  endpoint_id: string;
  external_id: string | null;
  raw_data: Json;
  mapped_data: Json;
  fetched_at: string;
  created_at: string;
  updated_at: string;
}

export interface FetchLog {
  id: string;
  endpoint_id: string;
  status: 'success' | 'error' | 'partial';
  records_fetched: number;
  records_created: number;
  records_updated: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'string' | 'number' | 'boolean' | 'date';
}

export interface PathVariable {
  variable: string;
  source_collection: string;
  source_field: string;
}

export interface EndpointFormData {
  name: string;
  description: string;
  collection_name: string;
  id_field: string;
  base_url: string;
  auth_type: 'none' | 'api_key' | 'bearer' | 'basic';
  auth_config: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    username?: string;
    password?: string;
  };
  field_mappings: FieldMapping[];
  response_path: string;
  pagination_type: 'none' | 'offset' | 'cursor' | 'page';
  pagination_config: {
    limit_param?: string;
    offset_param?: string;
    page_param?: string;
    cursor_param?: string;
    default_limit?: number;
  };
  path_variables: PathVariable[];
  is_active: boolean;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  last_seen?: string;
  last_ip?: string;
  last_device?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserFormData {
  username: string;
  password?: string; // Optional on update
  role: UserRole;
  is_active: boolean;
}

export interface ActivityLog {
  id: string;
  username: string;
  action: string;
  ip_address: string;
  device_info: string;
  location_data?: {
    country?: string;
    city?: string;
    isp?: string;
    org?: string;
  };
  created_at: Date | string;
}
