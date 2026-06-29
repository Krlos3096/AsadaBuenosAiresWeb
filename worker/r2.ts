import { R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  asada_buenosaires_images: R2Bucket;
  IMAGE_BASE_URL: string;
}

// Allowed file types (for images)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Allowed document types
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Generate a unique filename using UUID
export function generateUniqueFilename(originalName: string): string {
  const extension = originalName.split('.').pop() || 'jpg';
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
}

// Validate file type
export function isValidImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(type);
}

export function isValidDocumentType(type: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(type);
}

export function isValidFileType(type: string): boolean {
  return isValidImageType(type) || isValidDocumentType(type);
}

// Validate file size
export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// Get content type from file extension
export function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

// Generate public URL for an image key
export function getPublicUrl(key: string, baseUrl: string): string {
  return `${baseUrl}/${key}`;
}
