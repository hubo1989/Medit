// Blockquote conversion for DOCX export

import {
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import type { DOCXThemeStyles, DOCXBlockquoteNode } from '../types/docx';
import type { InlineResult, InlineNode } from './docx-inline-converter';

type ConvertInlineNodesFunction = (children: InlineNode[], options?: { color?: string }) => Promise<InlineResult[]>;

interface BlockquoteConverterOptions {
  themeStyles: DOCXThemeStyles;
  convertInlineNodes: ConvertInlineNodesFunction;
}

export interface BlockquoteConverter {
  convertBlockquote(node: DOCXBlockquoteNode, nestLevel?: number): Promise<Paragraph[]>;
}

/**
 * Create a blockquote converter
 * @param options - Configuration options
 * @returns Blockquote converter
 */
export function createBlockquoteConverter({ themeStyles, convertInlineNodes }: BlockquoteConverterOptions): BlockquoteConverter {
  // Default spacing values
  const defaultSpacing = themeStyles.default?.paragraph?.spacing || { before: 0, line: 276 };
  
  /**
   * Convert blockquote node to DOCX paragraphs
   * @param node - Blockquote AST node
   * @param nestLevel - Current nesting level (default: 0)
   * @returns Array of DOCX Paragraphs
   */
  async function convertBlockquote(node: DOCXBlockquoteNode, nestLevel = 0): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];
    const outerIndent = 0.3 + (nestLevel * 0.3);
    const leftBorderAndPadding = 0.13;
    const rightBorderAndPadding = 0.09;

    const defaultLineSpacing = defaultSpacing.line ?? 276;
    const compressedLineSpacing = Math.round(240 + (defaultLineSpacing - 240) / 4);
    const lineSpacingExtra = compressedLineSpacing - 240;
    const originalHalfSpacing = (defaultSpacing.before ?? 0) - (defaultLineSpacing - 240) / 2;
    const blockquoteInterParagraphSpacing = originalHalfSpacing + lineSpacingExtra / 2;

    const buildParagraphConfig = (children: InlineResult[], spacingBefore = 0, spacingAfter = 0) => ({
      children: children as TextRun[],
      spacing: { before: spacingBefore, after: spacingAfter, line: compressedLineSpacing },
      alignment: AlignmentType.LEFT,
      indent: {
        left: convertInchesToTwip(outerIndent - leftBorderAndPadding),
        right: convertInchesToTwip(rightBorderAndPadding),
      },
      border: {
        left: { color: 'DFE2E5', space: 6, style: BorderStyle.SINGLE, size: 24 },
        top: { color: 'F6F8FA', space: 4, style: BorderStyle.SINGLE, size: 1 },
        bottom: { color: 'F6F8FA', space: 4, style: BorderStyle.SINGLE, size: 1 },
        right: { color: 'F6F8FA', space: 6, style: BorderStyle.SINGLE, size: 1 },
      },
      shading: { fill: 'F6F8FA' },
    });

    const childCount = node.children.length;
    let childIndex = 0;

    for (const child of node.children) {
      if (child.type === 'paragraph') {
        const children = await convertInlineNodes(child.children as InlineNode[], { color: '6A737D' });
        const isFirst = (childIndex === 0);
        const isLast = (childIndex === childCount - 1);

        let spacingBefore = 0;
        if (isFirst && nestLevel === 0) {
          spacingBefore = 200;
        } else if (!isFirst) {
          spacingBefore = blockquoteInterParagraphSpacing;
        }

        const spacingAfter = (isLast && nestLevel === 0) ? 300 : 0;
        paragraphs.push(new Paragraph(buildParagraphConfig(children, spacingBefore, spacingAfter)));
        childIndex++;
      } else if (child.type === 'blockquote') {
        const nested = await convertBlockquote(child as DOCXBlockquoteNode, nestLevel + 1);
        paragraphs.push(...nested);
        childIndex++;
      }
    }

    return paragraphs;
  }

  return { convertBlockquote };
}
