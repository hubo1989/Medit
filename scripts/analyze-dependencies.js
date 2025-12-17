#!/usr/bin/env node

/**
 * 依赖分析工具
 * 分析项目中所有 JavaScript 文件的依赖关系
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

// 存储所有文件的依赖信息
const dependencies = new Map();

/**
 * 提取文件中的导入语句
 */
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = {
    internal: [], // 项目内部依赖
    external: []  // 外部依赖（node_modules）
  };

  // 匹配 import 语句
  const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    if (importPath.startsWith('.')) {
      // 内部依赖
      const absolutePath = path.resolve(path.dirname(filePath), importPath);
      const normalizedPath = absolutePath.replace(projectRoot, '').replace(/\\/g, '/');
      imports.internal.push(normalizedPath);
    } else {
      // 外部依赖
      const pkgName = importPath.split('/')[0];
      if (!imports.external.includes(pkgName)) {
        imports.external.push(pkgName);
      }
    }
  }

  return imports;
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      const relativePath = fullPath.replace(projectRoot, '').replace(/\\/g, '/');
      const imports = extractImports(fullPath);
      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
      
      dependencies.set(relativePath, {
        path: relativePath,
        fullPath,
        lines,
        imports
      });
    }
  }
}

/**
 * 计算依赖层级
 */
function calculateLevels() {
  const levels = new Map();
  const processed = new Set();
  
  function getLevel(filePath) {
    if (levels.has(filePath)) {
      return levels.get(filePath);
    }
    
    if (processed.has(filePath)) {
      // 循环依赖
      return -1;
    }
    
    const fileInfo = dependencies.get(filePath);
    if (!fileInfo) {
      return 0;
    }
    
    // 如果没有内部依赖，层级为 0
    if (fileInfo.imports.internal.length === 0) {
      levels.set(filePath, 0);
      return 0;
    }
    
    processed.add(filePath);
    
    // 计算所有依赖的最大层级
    let maxLevel = 0;
    for (const dep of fileInfo.imports.internal) {
      // 处理没有 .js 扩展名的情况
      let depPath = dep;
      if (!dependencies.has(depPath) && !depPath.endsWith('.js')) {
        depPath = depPath + '.js';
      }
      
      const depLevel = getLevel(depPath);
      if (depLevel === -1) {
        // 循环依赖
        continue;
      }
      maxLevel = Math.max(maxLevel, depLevel);
    }
    
    processed.delete(filePath);
    const level = maxLevel + 1;
    levels.set(filePath, level);
    return level;
  }
  
  // 计算所有文件的层级
  for (const filePath of dependencies.keys()) {
    getLevel(filePath);
  }
  
  return levels;
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('='.repeat(80));
  console.log('TypeScript 迁移依赖分析报告');
  console.log('='.repeat(80));
  console.log();
  
  // 按目录分组
  const byDirectory = new Map();
  for (const [filePath, info] of dependencies.entries()) {
    const dir = path.dirname(filePath);
    if (!byDirectory.has(dir)) {
      byDirectory.set(dir, []);
    }
    byDirectory.get(dir).push(info);
  }
  
  // 计算层级
  const levels = calculateLevels();
  
  // 按层级分组
  const byLevel = new Map();
  for (const [filePath, level] of levels.entries()) {
    if (!byLevel.has(level)) {
      byLevel.set(level, []);
    }
    byLevel.get(level).push(filePath);
  }
  
  // 统计信息
  console.log('📊 整体统计');
  console.log('-'.repeat(80));
  console.log(`总文件数: ${dependencies.size}`);
  console.log(`总代码行数: ${Array.from(dependencies.values()).reduce((sum, f) => sum + f.lines, 0)}`);
  console.log();
  
  // 外部依赖统计
  const allExternalDeps = new Set();
  for (const info of dependencies.values()) {
    info.imports.external.forEach(dep => allExternalDeps.add(dep));
  }
  console.log('📦 外部依赖 (需要类型定义):');
  console.log('-'.repeat(80));
  const sortedDeps = Array.from(allExternalDeps).sort();
  sortedDeps.forEach(dep => {
    const count = Array.from(dependencies.values()).filter(f => f.imports.external.includes(dep)).length;
    console.log(`  ${dep.padEnd(30)} (${count} 个文件使用)`);
  });
  console.log();
  
  // 按目录分组的统计
  console.log('📁 按目录分组:');
  console.log('-'.repeat(80));
  const sortedDirs = Array.from(byDirectory.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [dir, files] of sortedDirs) {
    const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
    const noInternalDeps = files.filter(f => f.imports.internal.length === 0).length;
    console.log(`\n${dir}/`);
    console.log(`  文件数: ${files.length}, 代码行数: ${totalLines}, 无内部依赖: ${noInternalDeps}`);
    
    files.sort((a, b) => a.imports.internal.length - b.imports.internal.length);
    files.forEach(f => {
      const level = levels.get(f.path) ?? '?';
      const internalCount = f.imports.internal.length;
      const externalCount = f.imports.external.length;
      console.log(`    [L${level}] ${path.basename(f.path).padEnd(40)} (${f.lines} 行, ${internalCount} 内部, ${externalCount} 外部)`);
    });
  }
  console.log();
  
  // 按层级分组
  console.log('🎯 迁移阶段建议 (按依赖层级):');
  console.log('-'.repeat(80));
  const sortedLevels = Array.from(byLevel.entries()).sort((a, b) => a[0] - b[0]);
  for (const [level, files] of sortedLevels) {
    const totalLines = files.reduce((sum, f) => {
      const info = dependencies.get(f);
      return sum + (info?.lines || 0);
    }, 0);
    
    console.log(`\n阶段 ${level + 1} (层级 ${level}): ${files.length} 个文件, ${totalLines} 行代码`);
    
    files.sort((a, b) => a.localeCompare(b));
    files.forEach(f => {
      const info = dependencies.get(f);
      if (info) {
        const internalDeps = info.imports.internal.length;
        const externalDeps = info.imports.external.length;
        console.log(`    ${f.padEnd(60)} (${info.lines} 行, ${internalDeps} 内部, ${externalDeps} 外部)`);
      }
    });
  }
  console.log();
  
  // 循环依赖检测
  const circularDeps = Array.from(levels.entries()).filter(([_, level]) => level === -1);
  if (circularDeps.length > 0) {
    console.log('⚠️  循环依赖:');
    console.log('-'.repeat(80));
    circularDeps.forEach(([file]) => {
      console.log(`  ${file}`);
    });
    console.log();
  }
  
  console.log('='.repeat(80));
}

// 执行分析
scanDirectory(srcDir);
generateReport();
