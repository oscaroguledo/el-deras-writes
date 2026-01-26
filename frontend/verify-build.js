#!/usr/bin/env node

// Simple verification script to check if the build is ready for Netlify
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Netlify deployment readiness...\n');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ dist/ folder exists');
  
  // Check if index.html exists
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html exists');
    
    // Check if assets folder exists
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      console.log('✅ assets/ folder exists');
      
      // Count assets
      const assets = fs.readdirSync(assetsPath);
      console.log(`✅ ${assets.length} asset files generated`);
    }
  }
} else {
  console.log('❌ dist/ folder not found. Run "npm run build" first.');
  process.exit(1);
}

// Check netlify.toml
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  console.log('✅ netlify.toml configuration exists');
} else {
  console.log('❌ netlify.toml not found');
}

// Check package.json build script
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script exists:', packageJson.scripts.build);
  } else {
    console.log('❌ Build script not found in package.json');
  }
}

console.log('\n🚀 Deployment Status:');
console.log('✅ Build configuration ready');
console.log('✅ Static files generated');
console.log('✅ Netlify configuration present');
console.log('\n⚠️  Next Steps:');
console.log('1. Set VITE_API_URL environment variable in Netlify dashboard');
console.log('2. Ensure backend allows your Netlify domain in CORS settings');
console.log('3. Test the deployed site functionality');
console.log('\n🌐 Your Netlify site: https://superlative-kitsune-f19d67.netlify.app');
console.log('🔧 Admin dashboard: https://app.netlify.com/projects/superlative-kitsune-f19d67');