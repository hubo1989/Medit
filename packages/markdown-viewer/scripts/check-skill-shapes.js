#!/usr/bin/env node

/**
 * Check if shapes/stencils used in skills directory exist in the reference files.
 * 
 * Usage: node scripts/check-skill-shapes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const STENCIL_NAMES_FILE = path.join(__dirname, '..', 'temp', 'stencil-names.json');
const SHAPE_USAGE_FILE = path.join(__dirname, '..', 'temp', 'shape-usage.json');

// Load reference data
function loadReferenceData() {
  const stencilNames = JSON.parse(fs.readFileSync(STENCIL_NAMES_FILE, 'utf-8'));
  const shapeUsage = JSON.parse(fs.readFileSync(SHAPE_USAGE_FILE, 'utf-8'));
  
  // Build set of valid shapes
  const validShapes = new Set(stencilNames);
  
  // Add shapes from stencilUsage
  if (shapeUsage.stencilUsage) {
    Object.keys(shapeUsage.stencilUsage).forEach(s => validShapes.add(s));
  }
  
  // Add shapes from registeredUsage
  if (shapeUsage.registeredUsage) {
    Object.keys(shapeUsage.registeredUsage).forEach(s => validShapes.add(s));
  }
  
  return validShapes;
}

// Extract shape names from drawio content
function extractShapes(content) {
  const shapes = [];
  
  // Match shape=mxgraph.xxx.yyy patterns
  const shapeRegex = /shape=(mxgraph\.[a-zA-Z0-9_.-]+)/g;
  let match;
  while ((match = shapeRegex.exec(content)) !== null) {
    shapes.push({
      shape: match[1],
      context: content.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
    });
  }
  
  return shapes;
}

// Scan skills directory for markdown files with drawio content
function scanSkillsDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanSkillsDir(fullPath, results);
    } else if (entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check if file contains drawio code blocks
      if (content.includes('```drawio')) {
        const shapes = extractShapes(content);
        if (shapes.length > 0) {
          results.push({
            file: path.relative(SKILLS_DIR, fullPath),
            shapes: shapes
          });
        }
      }
    }
  }
  
  return results;
}

// Main function
function main() {
  console.log('Loading reference data...');
  const validShapes = loadReferenceData();
  console.log(`Loaded ${validShapes.size} valid shapes\n`);
  
  console.log('Scanning skills directory...');
  const skillFiles = scanSkillsDir(SKILLS_DIR);
  console.log(`Found ${skillFiles.length} files with drawio content\n`);
  
  let totalShapes = 0;
  let invalidShapes = 0;
  const invalidByFile = {};
  const allInvalidShapes = new Set();
  
  for (const file of skillFiles) {
    const invalidInFile = [];
    
    for (const { shape } of file.shapes) {
      totalShapes++;
      
      if (!validShapes.has(shape)) {
        invalidShapes++;
        invalidInFile.push(shape);
        allInvalidShapes.add(shape);
      }
    }
    
    if (invalidInFile.length > 0) {
      invalidByFile[file.file] = [...new Set(invalidInFile)];
    }
  }
  
  // Report results
  console.log('='.repeat(60));
  console.log('SHAPE VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total shapes checked: ${totalShapes}`);
  console.log(`Valid shapes: ${totalShapes - invalidShapes}`);
  console.log(`Invalid shapes: ${invalidShapes}`);
  console.log('');
  
  if (Object.keys(invalidByFile).length > 0) {
    console.log('Files with invalid shapes:');
    console.log('-'.repeat(60));
    
    for (const [file, shapes] of Object.entries(invalidByFile)) {
      console.log(`\n📄 ${file}`);
      shapes.forEach(s => console.log(`   ❌ ${s}`));
    }
    
    console.log('\n' + '-'.repeat(60));
    console.log('All unique invalid shapes:');
    [...allInvalidShapes].sort().forEach(s => console.log(`  - ${s}`));
  } else {
    console.log('✅ All shapes are valid!');
  }
  
  // Exit with error code if invalid shapes found
  process.exit(Object.keys(invalidByFile).length > 0 ? 1 : 0);
}

main();
