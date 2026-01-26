# Media Branch

This branch is used for storing media files (images, videos, etc.) for the El Deras Writes blog application.

## Structure

Files are organized by category:
- `articles/` - Article images
- `profiles/` - User profile images  
- `general/` - General purpose images
- `uploads/` - User uploaded content

## CDN Access

Files in this branch are accessible via jsDelivr CDN:
`https://cdn.jsdelivr.net/gh/oscaroguledo/el-deras-writes@media/path/to/file`

## Automated Uploads

Files are automatically uploaded to this branch via the GitHub API from the blog application's admin interface.