/**
 * Heading Numbering Tests
 * 
 * Tests for the heading numbering functionality across different languages.
 * Configuration is loaded directly from messages.json to ensure consistency.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  numberHeadings,
  removeHeadingNumbers,
  toNumeral,
  HeadingNumberingConfig,
  removeExistingNumbering
} from '../vscode/src/tools/heading-numbering.ts';

import {
  parsePatterns,
  buildConfigFromMessages
} from '../vscode/src/tools/heading-numbering-config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.join(__dirname, '../src/_locales');

/**
 * Load config from messages.json for a specific locale
 */
function loadConfig(locale: string): HeadingNumberingConfig {
  const messagesPath = path.join(LOCALES_DIR, locale, 'messages.json');
  const content = fs.readFileSync(messagesPath, 'utf-8');
  const messages = JSON.parse(content);
  return buildConfigFromMessages(messages);
}

/**
 * Check if a locale has heading numbering config
 */
function hasHeadingConfig(locale: string): boolean {
  try {
    const messagesPath = path.join(LOCALES_DIR, locale, 'messages.json');
    const content = fs.readFileSync(messagesPath, 'utf-8');
    const messages = JSON.parse(content);
    return !!messages.heading_h2_format;
  } catch {
    return false;
  }
}

// ============================================================================
// Unit Tests for Core Functions
// ============================================================================

describe('toNumeral', () => {
  it('should convert to arabic numerals', () => {
    assert.strictEqual(toNumeral(1, 'arabic'), '1');
    assert.strictEqual(toNumeral(10, 'arabic'), '10');
    assert.strictEqual(toNumeral(99, 'arabic'), '99');
  });

  it('should convert to chinese numerals', () => {
    assert.strictEqual(toNumeral(1, 'chinese'), '一');
    assert.strictEqual(toNumeral(2, 'chinese'), '二');
    assert.strictEqual(toNumeral(10, 'chinese'), '十');
    assert.strictEqual(toNumeral(11, 'chinese'), '十一');
    assert.strictEqual(toNumeral(20, 'chinese'), '二十');
  });

  it('should convert to roman numerals', () => {
    assert.strictEqual(toNumeral(1, 'roman'), 'I');
    assert.strictEqual(toNumeral(4, 'roman'), 'IV');
    assert.strictEqual(toNumeral(5, 'roman'), 'V');
    assert.strictEqual(toNumeral(9, 'roman'), 'IX');
    assert.strictEqual(toNumeral(10, 'roman'), 'X');
  });

  it('should fallback to arabic for unknown system', () => {
    assert.strictEqual(toNumeral(5, 'unknown'), '5');
  });
});

describe('parsePatterns', () => {
  it('should parse pipe-separated patterns', () => {
    const patterns = parsePatterns('^test1|^test2|^test3');
    assert.strictEqual(patterns.length, 3);
    assert.ok(patterns[0].test('test1 content'));
    assert.ok(patterns[1].test('test2 content'));
  });

  it('should handle empty string', () => {
    const patterns = parsePatterns('');
    assert.strictEqual(patterns.length, 0);
  });

  it('should filter empty patterns', () => {
    const patterns = parsePatterns('^test1||^test2');
    assert.strictEqual(patterns.length, 2);
  });
});

// ============================================================================
// Chinese (zh_CN) Tests
// ============================================================================

describe('zh_CN - Chinese Simplified', () => {
  const config = loadConfig('zh_CN');

  describe('numberHeadings', () => {
    it('should not number h1', () => {
      const input = '# Document Title';
      const result = numberHeadings(input, config);
      assert.strictEqual(result, '# Document Title');
    });

    it('should number h2 with Chinese chapter format', () => {
      const input = '# Title\n## Introduction\n## Background';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## 第一章 Introduction'), `Expected Chinese chapter, got: ${result}`);
      assert.ok(result.includes('## 第二章 Background'), `Expected Chinese chapter, got: ${result}`);
    });

    it('should number h3 with numeric format', () => {
      const input = '## Chapter\n### Section A\n### Section B';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('### 1.1 Section A'), `Expected 1.1, got: ${result}`);
      assert.ok(result.includes('### 1.2 Section B'), `Expected 1.2, got: ${result}`);
    });

    it('should number h4 with deeper numeric format', () => {
      const input = '## Chapter\n### Section\n#### Subsection A\n#### Subsection B';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('#### 1.1.1 Subsection A'), `Expected 1.1.1, got: ${result}`);
      assert.ok(result.includes('#### 1.1.2 Subsection B'), `Expected 1.1.2, got: ${result}`);
    });

    it('should reset counters for new chapter', () => {
      const input = '## Chapter 1\n### Section\n## Chapter 2\n### Section';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('### 1.1 Section'), `First section should be 1.1`);
      assert.ok(result.includes('### 2.1 Section'), `Second chapter section should be 2.1`);
    });

    it('should remove existing Chinese numbering before re-numbering', () => {
      const input = '## 第三章 Introduction\n### 5.2 Section';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## 第一章 Introduction'), `Should renumber to 第一章`);
      assert.ok(result.includes('### 1.1 Section'), `Should renumber to 1.1`);
    });

    it('should handle already-numbered h3 correctly (regression test)', () => {
      // Ensure "### 1.1 某文本" doesn't become "### 1.1 1 某文本"
      const input = '## 章节\n### 1.1 平台定位';
      const result = numberHeadings(input, config);
      assert.strictEqual(result, '## 第一章 章节\n### 1.1 平台定位',
        `Should not duplicate numbering, got: ${result}`);
    });

    it('should skip code blocks', () => {
      const input = '## Title\n```markdown\n## Not a heading\n```\n## Another';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## Not a heading'), 'Code block content should be unchanged');
      assert.ok(result.includes('## 第二章 Another'), 'Heading after code block should be numbered');
    });
  });

  describe('removeHeadingNumbers', () => {
    it('should remove Chinese chapter numbers', () => {
      const input = '## 第一章 Introduction\n## 第二章 Background';
      const result = removeHeadingNumbers(input, config);
      assert.strictEqual(result, '## Introduction\n## Background');
    });

    it('should remove numeric section numbers', () => {
      const input = '### 1.1 Section\n### 1.2 Another';
      const result = removeHeadingNumbers(input, config);
      assert.strictEqual(result, '### Section\n### Another');
    });

    it('should remove various Chinese numbering formats', () => {
      const testCases = [
        { input: '## 一、Introduction', expected: '## Introduction' },
        { input: '## （一）Introduction', expected: '## Introduction' },
        { input: '## (1) Introduction', expected: '## Introduction' },
        { input: '## 1、Introduction', expected: '## Introduction' },
      ];
      for (const { input, expected } of testCases) {
        const result = removeHeadingNumbers(input, config);
        assert.strictEqual(result, expected, `Failed for input: ${input}`);
      }
    });
  });
});

// ============================================================================
// English (en) Tests
// ============================================================================

describe('en - English', () => {
  const config = loadConfig('en');

  describe('numberHeadings', () => {
    it('should number h2 with Chapter format', () => {
      const input = '# Title\n## Introduction\n## Background';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## Chapter 1 Introduction'), `Expected Chapter 1, got: ${result}`);
      assert.ok(result.includes('## Chapter 2 Background'), `Expected Chapter 2, got: ${result}`);
    });

    it('should number h3 with numeric format', () => {
      const input = '## Chapter\n### Section A\n### Section B';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('### 1.1 Section A'));
      assert.ok(result.includes('### 1.2 Section B'));
    });

    it('should remove existing English numbering', () => {
      const input = '## Chapter 5 Introduction\n### 3.2.1 Section';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## Chapter 1 Introduction'));
      assert.ok(result.includes('### 1.1 Section'));
    });

    it('should handle already-numbered h3 correctly (regression test)', () => {
      // Ensure "### 1.1 Some text" doesn't become "### 1.1 1 Some text"
      const input = '## Chapter\n### 1.1 Platform Overview';
      const result = numberHeadings(input, config);
      assert.strictEqual(result, '## Chapter 1 Chapter\n### 1.1 Platform Overview',
        `Should not duplicate numbering, got: ${result}`);
    });
  });

  describe('removeHeadingNumbers', () => {
    it('should remove Chapter prefix', () => {
      const input = '## Chapter 1 Introduction\n## Chapter 2 Background';
      const result = removeHeadingNumbers(input, config);
      assert.strictEqual(result, '## Introduction\n## Background');
    });

    it('should remove Section prefix', () => {
      const input = '### Section 1.1 Details';
      const result = removeHeadingNumbers(input, config);
      assert.strictEqual(result, '### Details');
    });

    it('should remove various English numbering formats', () => {
      const testCases = [
        { input: '## Part I Introduction', expected: '## Introduction' },
        { input: '## 1. Introduction', expected: '## Introduction' },
        { input: '### (a) Details', expected: '### Details' },
      ];
      for (const { input, expected } of testCases) {
        const result = removeHeadingNumbers(input, config);
        assert.strictEqual(result, expected, `Failed for input: ${input}`);
      }
    });
  });
});

// ============================================================================
// Japanese (ja) Tests
// ============================================================================

describe('ja - Japanese', () => {
  const config = loadConfig('ja');

  describe('numberHeadings', () => {
    it('should number h2 with Japanese chapter format', () => {
      const input = '# タイトル\n## はじめに\n## 背景';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## 第1章 はじめに'), `Expected 第1章, got: ${result}`);
      assert.ok(result.includes('## 第2章 背景'), `Expected 第2章, got: ${result}`);
    });

    it('should number h3 with numeric format', () => {
      const input = '## 章\n### セクションA\n### セクションB';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('### 1.1 セクションA'));
      assert.ok(result.includes('### 1.2 セクションB'));
    });

    it('should handle already-numbered h3 correctly (regression test)', () => {
      // Ensure "### 1.1 Some text" doesn't become "### 1.1 1 Some text"
      const input = '## 章\n### 1.1 既存の番号付きセクション';
      const result = numberHeadings(input, config);
      assert.strictEqual(result, '## 第1章 章\n### 1.1 既存の番号付きセクション',
        `Should not duplicate numbering, got: ${result}`);
    });
  });

  describe('removeHeadingNumbers', () => {
    it('should remove Japanese chapter numbers', () => {
      const input = '## 第1章 はじめに\n## 第2章 背景';
      const result = removeHeadingNumbers(input, config);
      assert.strictEqual(result, '## はじめに\n## 背景');
    });
  });
});

// ============================================================================
// Korean (ko) Tests
// ============================================================================

describe('ko - Korean', () => {
  const config = loadConfig('ko');

  describe('numberHeadings', () => {
    it('should number h2 with Korean chapter format', () => {
      const input = '# 제목\n## 소개\n## 배경';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('## 제1장 소개'), `Expected 제1장, got: ${result}`);
      assert.ok(result.includes('## 제2장 배경'), `Expected 제2장, got: ${result}`);
    });

    it('should number h3 with numeric format', () => {
      const input = '## 장\n### 섹션A\n### 섹션B';
      const result = numberHeadings(input, config);
      assert.ok(result.includes('### 1.1 섹션A'));
      assert.ok(result.includes('### 1.2 섹션B'));
    });
  });

  describe('numberHeadings - Already numbered content', () => {
    it('should handle already-numbered h3 correctly (bug fix for 1.1 duplication)', () => {
      // This was the reported bug: "### 1.1 平台定位" becomes "### 1.1 1 평台定位"
      const input = '## 장\n### 1.1 기존 번호가 있는 섹션';
      const result = numberHeadings(input, config);
      // Should renumber to 1.1, not 1.1 1
      assert.strictEqual(result, '## 제1장 장\n### 1.1 기존 번호가 있는 섹션', 
        `Should remove existing "1.1 " before renumbering, got: ${result}`);
    });
  });

  describe('removeHeadingNumbers', () => {
    it('should remove Korean chapter numbers', () => {
      const input = '## 제1장 소개\n## 제2장 배경';
      const result = removeHeadingNumbers(input, config);
      assert.strictEqual(result, '## 소개\n## 배경');
    });
  });
});

// ============================================================================
// Config Validation Tests
// ============================================================================

describe('Locale Config Validation', () => {
  // Expected h2 chapter prefix for each locale (first chapter)
  const expectedH2Prefixes: Record<string, string> = {
    'zh_CN': '第一章',
    'zh_TW': '第一章',
    'en': 'Chapter 1',
    'ja': '第1章',
    'ko': '제1장',
    'de': 'Kapitel 1',
    'fr': 'Chapitre 1',
    'es': 'Capítulo 1',
    'it': 'Capitolo 1',
    'pt_BR': 'Capítulo 1',
    'pt_PT': 'Capítulo 1',
    'ru': 'Глава 1',
    'uk': 'Розділ 1',
    'pl': 'Rozdział 1',
    'nl': 'Hoofdstuk 1',
    'sv': 'Kapitel 1',
    'da': 'Kapitel 1',
    'no': 'Kapittel 1',
    'fi': 'Luku 1',
    'tr': 'Bölüm 1',
    'vi': 'Chương 1',
    'th': 'บทที่ 1',
    'id': 'Bab 1',
    'ms': 'Bab 1',
    'hi': 'अध्याय 1',
    'be': 'Раздзел 1',
    'et': 'Peatükk 1',
    'lt': 'Skyrius 1',
  };

  const allLocales = Object.keys(expectedH2Prefixes);

  for (const locale of allLocales) {
    it(`${locale} should have valid heading config`, () => {
      assert.ok(hasHeadingConfig(locale), `${locale} should have heading_h2_format`);
      
      const config = loadConfig(locale);
      assert.ok(config.h2Format, `${locale} should have h2Format`);
      assert.ok(config.h2Format.includes('{0}'), `${locale} h2Format should contain {0} placeholder`);
      assert.ok(['chinese', 'arabic', 'roman'].includes(config.h2Numerals), 
        `${locale} h2Numerals should be valid: ${config.h2Numerals}`);
      assert.ok(Array.isArray(config.removePatterns), `${locale} should have removePatterns array`);
    });

    it(`${locale} should number h2 with correct locale-specific prefix`, () => {
      const config = loadConfig(locale);
      const input = '## Introduction\n### Section A\n## Background';
      const output = numberHeadings(input, config);

      const expectedPrefix = expectedH2Prefixes[locale];
      assert.ok(
        output.includes(`## ${expectedPrefix} Introduction`),
        `${locale}: first h2 should start with "${expectedPrefix}", got: ${output.split('\n')[0]}`
      );

      // Verify h3 uses numeric format 1.1 (under first chapter)
      assert.ok(
        output.includes('### 1.1 Section A'),
        `${locale}: h3 should use numeric format "1.1", got: ${output.split('\n')[1]}`
      );

      // Verify second chapter increments correctly
      const secondChapterNum = config.h2Numerals === 'chinese' ? '二' : '2';
      const expectedSecond = config.h2Format.replace('{0}', secondChapterNum);
      assert.ok(
        output.includes(`## ${expectedSecond} Background`),
        `${locale}: second h2 should have incremented number, got: ${output.split('\n')[2]}`
      );
    });

    it(`${locale} should re-number already-numbered headings (h3-h5) without duplication`, () => {
      const config = loadConfig(locale);

      const input = [
        '## Title',
        '### 1.1 Section',
        '#### 1.1.1 Subsection',
        '##### 1.1.1.1 Deep',
        '### 1.2 Another'
      ].join('\n');

      const output = numberHeadings(input, config);

      const chapterPrefix = config.h2Format.replace('{0}', toNumeral(1, config.h2Numerals));
      const expected = [
        `## ${chapterPrefix} Title`,
        '### 1.1 Section',
        '#### 1.1.1 Subsection',
        '##### 1.1.1.1 Deep',
        '### 1.2 Another'
      ].join('\n');

      assert.strictEqual(
        output,
        expected,
        `Already-numbered headings should be stripped then re-numbered. Locale=${locale}, got: ${output}`
      );

      // Guard for the reported failure mode: "1.1 1 ..."
      assert.ok(!output.includes('1.1 1 '), `Locale=${locale} should not contain duplicated numbering: ${output}`);
    });
  }
});

// ============================================================================
// Additional Language Tests
// ============================================================================

describe('de - German', () => {
  const config = loadConfig('de');

  it('should number h2 with Kapitel format', () => {
    const input = '# Titel\n## Einleitung\n## Hintergrund';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('## Kapitel 1 Einleitung'));
    assert.ok(result.includes('## Kapitel 2 Hintergrund'));
  });

  it('should number h3 with numeric format', () => {
    const input = '## Kapitel\n### Abschnitt A\n### Abschnitt B';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('### 1.1 Abschnitt A'));
    assert.ok(result.includes('### 1.2 Abschnitt B'));
  });

  it('should handle already-numbered h3 correctly (regression test)', () => {
    const input = '## Kapitel\n### 1.1 Bestehendes Nummern-Abschnitt';
    const result = numberHeadings(input, config);
    assert.strictEqual(result, '## Kapitel 1 Kapitel\n### 1.1 Bestehendes Nummern-Abschnitt',
      `Should not duplicate numbering, got: ${result}`);
  });

  it('should remove German chapter numbers', () => {
    const input = '## Kapitel 1 Einleitung';
    const result = removeHeadingNumbers(input, config);
    assert.strictEqual(result, '## Einleitung');
  });
});

describe('fr - French', () => {
  const config = loadConfig('fr');

  it('should number h2 with Chapitre format', () => {
    const input = '# Titre\n## Introduction\n## Contexte';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('## Chapitre 1 Introduction'));
    assert.ok(result.includes('## Chapitre 2 Contexte'));
  });

  it('should number h3 with numeric format', () => {
    const input = '## Chapitre\n### Section A\n### Section B';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('### 1.1 Section A'));
    assert.ok(result.includes('### 1.2 Section B'));
  });

  it('should handle already-numbered h3 correctly (regression test)', () => {
    const input = '## Chapitre\n### 1.1 Section existante avec numéro';
    const result = numberHeadings(input, config);
    assert.strictEqual(result, '## Chapitre 1 Chapitre\n### 1.1 Section existante avec numéro',
      `Should not duplicate numbering, got: ${result}`);
  });

  it('should remove French chapter numbers', () => {
    const input = '## Chapitre 1 Introduction';
    const result = removeHeadingNumbers(input, config);
    assert.strictEqual(result, '## Introduction');
  });
});

describe('ru - Russian', () => {
  const config = loadConfig('ru');

  it('should number h2 with Глава format', () => {
    const input = '# Заголовок\n## Введение\n## Контекст';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('## Глава 1 Введение'));
    assert.ok(result.includes('## Глава 2 Контекст'));
  });

  it('should number h3 with numeric format', () => {
    const input = '## Глава\n### Раздел A\n### Раздел B';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('### 1.1 Раздел A'));
    assert.ok(result.includes('### 1.2 Раздел B'));
  });

  it('should handle already-numbered h3 correctly (regression test)', () => {
    const input = '## Глава\n### 1.1 Существующий раздел с номером';
    const result = numberHeadings(input, config);
    assert.strictEqual(result, '## Глава 1 Глава\n### 1.1 Существующий раздел с номером',
      `Should not duplicate numbering, got: ${result}`);
  });

  it('should remove Russian chapter numbers', () => {
    const input = '## Глава 1 Введение';
    const result = removeHeadingNumbers(input, config);
    assert.strictEqual(result, '## Введение');
  });
});

describe('zh_TW - Chinese Traditional', () => {
  const config = loadConfig('zh_TW');

  it('should number h2 with Chinese chapter format', () => {
    const input = '# 標題\n## 簡介\n## 背景';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('## 第一章 簡介'));
    assert.ok(result.includes('## 第二章 背景'));
  });

  it('should number h3 with numeric format', () => {
    const input = '## 章節\n### 部分A\n### 部分B';
    const result = numberHeadings(input, config);
    assert.ok(result.includes('### 1.1 部分A'));
    assert.ok(result.includes('### 1.2 部分B'));
  });

  it('should handle already-numbered h3 correctly (regression test)', () => {
    const input = '## 章節\n### 1.1 已編號的部分';
    const result = numberHeadings(input, config);
    assert.strictEqual(result, '## 第一章 章節\n### 1.1 已編號的部分',
      `Should not duplicate numbering, got: ${result}`);
  });

  it('should remove Traditional Chinese chapter numbers', () => {
    const input = '## 第一章 簡介';
    const result = removeHeadingNumbers(input, config);
    assert.strictEqual(result, '## 簡介');
  });
});

// ============================================================================
// Universal Removal Tests (Language-agnostic)
// ============================================================================

describe('Universal numbering removal', () => {
  it('should remove common numeric prefixes', () => {
    const cases = [
      { input: '1. Introduction', expected: 'Introduction' },
      { input: '1．简介', expected: '简介' },
      { input: '1、背景', expected: '背景' },
      { input: '1.1 Platform Overview', expected: 'Platform Overview' },
      { input: '1.1.1 Details', expected: 'Details' },
    ];

    for (const c of cases) {
      assert.strictEqual(
        removeExistingNumbering(c.input, []),
        c.expected,
        `Failed for input: ${c.input}`
      );
    }
  });

  it('should remove parenthesized prefixes', () => {
    const cases = [
      { input: '(a) Details', expected: 'Details' },
      { input: '(1) Details', expected: 'Details' },
      { input: '（1） 详情', expected: '详情' },
    ];

    for (const c of cases) {
      assert.strictEqual(
        removeExistingNumbering(c.input, []),
        c.expected,
        `Failed for input: ${c.input}`
      );
    }
  });

  it('should remove CJK chapter/section prefixes', () => {
    const cases = [
      { input: '第一章 简介', expected: '简介' },
      { input: '第2章 はじめに', expected: 'はじめに' },
      { input: '제2장 소개', expected: '소개' },
      { input: '제10절 세부사항', expected: '세부사항' },
      { input: '一、概述', expected: '概述' },
      { input: '（一） 概述', expected: '概述' },
    ];

    for (const c of cases) {
      assert.strictEqual(
        removeExistingNumbering(c.input, []),
        c.expected,
        `Failed for input: ${c.input}`
      );
    }
  });

  it('should remove common European chapter/section words', () => {
    const cases = [
      { input: 'Chapter 2 Background', expected: 'Background' },
      { input: 'Kapitel 3 Einleitung', expected: 'Einleitung' },
      { input: 'Chapitre 4 Contexte', expected: 'Contexte' },
      { input: 'Capítulo 5 Introducción', expected: 'Introducción' },
      { input: 'Раздел 1.2 Детали', expected: 'Детали' },
      { input: 'Розділ 2 Вступ', expected: 'Вступ' },
      { input: 'Chương 3 Giới thiệu', expected: 'Giới thiệu' },
    ];

    for (const c of cases) {
      assert.strictEqual(
        removeExistingNumbering(c.input, []),
        c.expected,
        `Failed for input: ${c.input}`
      );
    }
  });
});
