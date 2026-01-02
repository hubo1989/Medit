/**
 * Heading Numbering - Pure functions for adding/removing heading numbers
 * 
 * This module is environment-agnostic and can be fully tested.
 */

/**
 * Numbering configuration interface
 */
export interface HeadingNumberingConfig {
  /** h2 format, e.g. "第{0}章", "Chapter {0}", "{0}." */
  h2Format: string;
  /** h2 numeral system: chinese | arabic | roman */
  h2Numerals: 'chinese' | 'arabic' | 'roman';
  /** Regex patterns to remove existing heading numbers */
  removePatterns: RegExp[];
}

// Chinese numerals
const chineseNumerals = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十',
  '三十一', '三十二', '三十三', '三十四', '三十五', '三十六', '三十七', '三十八', '三十九', '四十',
  '四十一', '四十二', '四十三', '四十四', '四十五', '四十六', '四十七', '四十八', '四十九', '五十'
];

// Roman numerals
const romanNumerals = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
  'XLI', 'XLII', 'XLIII', 'XLIV', 'XLV', 'XLVI', 'XLVII', 'XLVIII', 'XLIX', 'L'
];

/**
 * Convert number to specified numeral system
 */
export function toNumeral(n: number, system: string): string {
  switch (system) {
    case 'chinese':
      return chineseNumerals[n - 1] || n.toString();
    case 'roman':
      return romanNumerals[n - 1] || n.toString();
    default:
      return n.toString();
  }
}

/**
 * Remove existing numbering from heading text
 */
export function removeExistingNumbering(text: string, patterns: RegExp[]): string {
  // Universal patterns to strip common numbering formats across languages.
  // This reduces dependence on the current UI locale and prevents cases like
  // "1.1 1 ..." caused by partial stripping.
  const universalPatterns: RegExp[] = [
    // Multi-level numeric numbering: 1.1, 1.1.1, 1.1.1.1
    /^\d+(?:\.\d+)+\.?\s*/,
    // Single-level numeric numbering: 1. / 1． / 1、
    /^\d+[\.．、]\s*/,
    // Parenthesized numbering: (1) / （1） / (a)
    /^[（(][\da-zA-Z]+[)）]\s*/,

    // CJK chapter/section-style prefixes
    /^第[一二三四五六七八九十百千零〇\d]+[章节節章卷部分篇][、\s:：.]?\s*/,
    /^제\d+(?:장|절)[.\s]?\s*/,

    // Chinese list-style prefixes: 一、 / 一. / (一)
    /^[一二三四五六七八九十百千]+[、\.．]\s*/,
    /^[（(][一二三四五六七八九十百千]+[)）][、\s]?\s*/,

    // Common Latin/Cyrillic chapter/section words with numbers/roman numerals
    /^(?:Chapter|Section|Part|Kapitel|Abschnitt|Teil|Chapitre|Partie|Cap[ií]tulo|Secci[oó]n|Parte|Capitolo|Sezione|Hoofdstuk|Sectie|Deel|Kapittel|Seksjon|Rozdzia[łl]|Sekcja|Cz[ęe]ść|Глава|Раздел|Часть|Розділ|Частина|Luku|Peat[üu]kk|Skyrius|Afsnit|Avsnitt|Del|B[öo]l[üu]m|K[ıi]s[ıi]m|Chương|Phần|Bab|Bagian|Bahagian|บทที่|अध्याय|Раздзел)\s+[\dIVXLCDM.]+[.:)]?\s*/i,
  ];

  let result = text;

  for (const pattern of universalPatterns) {
    result = result.replace(pattern, '');
  }

  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

/**
 * Add numbering to Markdown document headings
 * 
 * @param content - Markdown document content
 * @param config - Numbering configuration
 * @returns Markdown content with numbered headings
 */
export function numberHeadings(content: string, config: HeadingNumberingConfig): string {
  const lines = content.split('\n');
  const result: string[] = [];
  
  let h2Count = 0;
  let counters = [0, 0, 0, 0]; // h3, h4, h5, h6
  let inCodeBlock = false;
  
  for (const line of lines) {
    // Check for code block boundaries
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (!headingMatch) {
      result.push(line);
      continue;
    }
    
    const hashes = headingMatch[1];
    const level = hashes.length;
    const headingText = removeExistingNumbering(headingMatch[2], config.removePatterns);
    
    if (level === 1) {
      // h1: No numbering
      result.push(`# ${headingText}`);
    } else if (level === 2) {
      // h2: Use configured format
      h2Count++;
      counters = [0, 0, 0, 0];
      const num = toNumeral(h2Count, config.h2Numerals);
      const prefix = config.h2Format.replace('{0}', num);
      result.push(`## ${prefix} ${headingText}`);
    } else {
      // h3-h6: Numeric format x.x.x
      const counterIndex = level - 3;
      counters[counterIndex]++;
      for (let i = counterIndex + 1; i < counters.length; i++) {
        counters[i] = 0;
      }
      
      let numbering = h2Count.toString();
      for (let i = 0; i <= counterIndex; i++) {
        numbering += '.' + counters[i];
      }
      
      result.push(`${hashes} ${numbering} ${headingText}`);
    }
  }
  
  return result.join('\n');
}

/**
 * Remove all heading numbers from Markdown document
 * 
 * @param content - Markdown document content
 * @param config - Numbering configuration (for patterns)
 * @returns Markdown content with numbering removed
 */
export function removeHeadingNumbers(content: string, config: HeadingNumberingConfig): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (!headingMatch) {
      result.push(line);
      continue;
    }
    
    const hashes = headingMatch[1];
    const headingText = removeExistingNumbering(headingMatch[2], config.removePatterns);
    result.push(`${hashes} ${headingText}`);
  }
  
  return result.join('\n');
}
