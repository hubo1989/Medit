// List conversion for DOCX export

import {
  Paragraph,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
  LevelFormat,
  type IParagraphOptions,
  type ParagraphChild,
} from 'docx';
import type { DOCXThemeStyles, DOCXListNode } from '../types/docx';
import type { InlineResult, InlineNode } from './docx-inline-converter';

// List item node within a DOCXListNode
interface ListItemNode {
  type: string;
  checked?: boolean | null;
  children: (InlineNode | DOCXListNode | { type: string; children?: InlineNode[] })[];
}

type ConvertInlineNodesFunction = (children: InlineNode[], options?: Record<string, unknown>) => Promise<InlineResult[]>;

interface ListConverterOptions {
  themeStyles: DOCXThemeStyles;
  convertInlineNodes: ConvertInlineNodesFunction;
  getListInstanceCounter: () => number;
  incrementListInstanceCounter: () => number;
}

interface NumberingLevel {
  level: number;
  format: (typeof LevelFormat)[keyof typeof LevelFormat];
  text: string;
  alignment: typeof AlignmentType.START;
  style: {
    paragraph: {
      indent: {
        left: number;
        hanging: number;
      };
    };
  };
}

/**
 * Create numbering levels configuration for ordered lists
 * @returns Numbering levels configuration
 */
export function createNumberingLevels(): NumberingLevel[] {
  const levels: NumberingLevel[] = [];
  const formats: Array<(typeof LevelFormat)[keyof typeof LevelFormat]> = [
    LevelFormat.DECIMAL,
    LevelFormat.LOWER_ROMAN,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_LETTER
  ];
  const baseIndent = 0.42;
  const indentStep = 0.42;
  const hanging = 0.28;

  for (let i = 0; i < 9; i++) {
    levels.push({
      level: i,
      format: formats[i],
      text: `%${i + 1}.`,
      alignment: AlignmentType.START,
      style: {
        paragraph: {
          indent: {
            left: convertInchesToTwip(baseIndent + i * indentStep),
            hanging: convertInchesToTwip(i === 8 ? 0.30 : hanging)
          },
        },
      },
    });
  }
  return levels;
}

export interface ListConverter {
  convertList(node: DOCXListNode): Promise<Paragraph[]>;
  convertListItem(ordered: boolean, item: ListItemNode, level: number, listInstance: number): Promise<Paragraph[]>;
}

/**
 * Create a list converter
 * @param options - Configuration options
 * @returns List converter
 */
export function createListConverter({ 
  themeStyles, 
  convertInlineNodes, 
  getListInstanceCounter,
  incrementListInstanceCounter
}: ListConverterOptions): ListConverter {
  // Default styles
  const defaultRun = themeStyles.default?.run || { font: 'Arial', size: 22 };
  const defaultSpacing = themeStyles.default?.paragraph?.spacing || { line: 276 };
  
  /**
   * Convert list node to DOCX paragraphs
   * @param node - List AST node
   * @returns Array of DOCX Paragraphs
   */
  async function convertList(node: DOCXListNode): Promise<Paragraph[]> {
    const items: Paragraph[] = [];
    const listInstance = incrementListInstanceCounter();

    for (const item of node.children) {
      const converted = await convertListItem(node.ordered ?? false, item as ListItemNode, 0, listInstance);
      if (converted) {
        items.push(...converted);
      }
    }

    return items;
  }

  /**
   * Convert list item node to DOCX paragraphs
   * @param ordered - Whether the list is ordered
   * @param node - ListItem AST node
   * @param level - Current nesting level
   * @param listInstance - List instance number for numbering
   * @returns Array of DOCX Paragraphs
   */
  async function convertListItem(ordered: boolean, node: ListItemNode, level: number, listInstance: number): Promise<Paragraph[]> {
    const items: Paragraph[] = [];
    const isTaskList = node.checked !== null && node.checked !== undefined;

    for (const child of node.children) {
      if (child.type === 'paragraph') {
        const paragraphChild = child as { type: string; children?: InlineNode[] };
        const children = await convertInlineNodes(paragraphChild.children || []);

        if (isTaskList) {
          const checkboxSymbol = node.checked ? '▣' : '☐';
          children.unshift(new TextRun({
            text: checkboxSymbol + ' ',
            font: defaultRun.font,
            size: defaultRun.size,
          }));
        }

        const defaultLineSpacing = defaultSpacing.line ?? 276;
        const baseParagraphConfig: IParagraphOptions = {
          children: children as ParagraphChild[],
          spacing: { before: 0, after: 0, line: defaultLineSpacing },
          alignment: AlignmentType.LEFT,
        };

        const paragraph = ordered && !isTaskList
          ? new Paragraph({
              ...baseParagraphConfig,
              numbering: {
                reference: 'default-ordered-list',
                level: level,
                instance: listInstance,
              },
            })
          : new Paragraph({
              ...baseParagraphConfig,
              bullet: { level: level },
            });

        items.push(paragraph);
      } else if (child.type === 'list') {
        const listChild = child as DOCXListNode;
        for (const nestedItem of listChild.children) {
          items.push(...await convertListItem(listChild.ordered ?? false, nestedItem as ListItemNode, level + 1, listInstance));
        }
      }
    }

    return items;
  }

  return { convertList, convertListItem };
}
