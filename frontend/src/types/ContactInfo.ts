export interface ContactInfo {
  id?: string; // Changed to string as per UUIDField in backend
  phone: string | null;
  email: string | null;
  social_media_links: { [key: string]: string }; // New field for dynamic social media links
}
