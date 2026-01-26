import { Octokit } from "@octokit/rest";
import CryptoJS from "crypto-js";

// Secret key for AES encryption/decryption of GitHub token
const secretKey = "https://chatgpt.com/?hints=search&openaicom_referred=true";

// Encrypted GitHub personal access token (encrypted with AES)
// Note: In production, this should be stored in environment variables
const encryptedToken = "U2FsdGVkX18gnLCiqO1HbjNV9Ohx+Yx82tz1UJynGyahAeB2rNaRRKp5ZMnZEstPlk6Xo0y8MDN6d/pWH+UMKQ==";

// Decrypt the GitHub token
const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

// Initialize Octokit client with decrypted token
const octokit = new Octokit({
    auth: decryptedToken
});

// GitHub repository configuration for image storage
const GITHUB_OWNER = "oscaroguledo";
const GITHUB_REPO = "el-deras-writes";
const GITHUB_BRANCH = "media";

/**
 * Convert a File object to base64 string (without prefix)
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result && typeof reader.result === 'string') {
                const base64 = reader.result.split(",")[1]; // Remove "data:*/*;base64," prefix
                resolve(base64);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Upload a single File object to GitHub and return jsDelivr link
 */
export async function uploadSingleFile(file: File, category: string): Promise<{cdnUrl: string, uploadPath: string}> {
    const base64Content = await fileToBase64(file);
    // Create upload path with category folder and sanitized filename
    const uploadPath = `${category.toLowerCase().replace(/\s+/g, "_")}/${file.name}`;

    // Check if file already exists to get its SHA (required for updates)
    let sha: string | undefined = undefined;
    try {
        const { data: existing } = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: uploadPath,
        ref: GITHUB_BRANCH,
        });
        if ('sha' in existing) {
            sha = existing.sha;
        }
    } catch (error: any) {
        // 404 means file doesn't exist yet, which is fine
        if (error.status !== 404) throw error;
    }

    // Upload or update the file in GitHub
    await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: uploadPath,
        message: `Upload ${uploadPath}`,
        content: base64Content,
        branch: GITHUB_BRANCH,
        sha, // Include SHA if updating existing file
    });

  // Generate jsDelivr CDN URL for fast global delivery
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH}/${uploadPath}`;
  return {cdnUrl, uploadPath};
}

/**
 * Delete a single file from the GitHub repository
 */
async function deleteSingleFile(filePath: string): Promise<any> {
  // Retrieve file SHA (required for deletion)
  const { data: existing } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: filePath,
    ref: GITHUB_BRANCH,
  });
  
  if (!('sha' in existing)) {
    throw new Error('File not found or is a directory');
  }
  
  const sha = existing.sha;

  // Delete the file from GitHub
  const res = await octokit.repos.deleteFile({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: filePath,
    message: `Delete ${filePath}`,
    branch: GITHUB_BRANCH,
    sha,
    committer: {
      name: "Automated Deleter",
      email: "noreply@el-deras-writes.com",
    },
  });

  return res;
}


/**
 * Upload multiple File objects to GitHub sequentially
 */
export async function uploadMultipleFiles(files: File[], category: string): Promise<Array<{name: string, url?: string, githubPath?: string, error?: any}>> {
    const results = [];

    for (const file of files) {
        try {
            const {cdnUrl, uploadPath} = await uploadSingleFile(file, category);
            results.push({ name: file.name, url: cdnUrl, githubPath: uploadPath });
        } catch (err) {
            results.push({ name: file.name, error: err });
        }
    }
    return results;
}

/**
 * Delete multiple files from GitHub repository
 */
export async function deleteMultipleFiles(files: Array<{ githubPath: string }>): Promise<Array<{filePath: string, success: boolean, res?: any, error?: string}>> {
    const results = [];
    for (const filePath of files) {
        try {
            const res = await deleteSingleFile(filePath.githubPath);
            results.push({ filePath: filePath?.githubPath, success: true, res });
        } catch (error: any) {
            results.push({ filePath: filePath?.githubPath, success: false, error: error.message });
        }
    }
    return results;
}
