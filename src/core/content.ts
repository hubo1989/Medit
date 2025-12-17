// Markdown Viewer Content Script - Chrome Extension Entry Point
// Uses shared markdown-processor for core processing logic

import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import ExtensionRenderer from '../utils/renderer';
import DocxExporter from '../exporters/docx-exporter';
import Localization, { DEFAULT_SETTING_LOCALE } from '../utils/localization';
import themeManager from '../utils/theme-manager';
import { loadAndApplyTheme } from '../utils/theme-to-css';
import { registerRemarkPlugins } from '../plugins/index';
import { platform } from '../platform/chrome/index';
import type { PluginRenderer } from '../types/index';
import {
  normalizeMathBlocks,
  escapeHtml,
  sanitizeRenderedHtml,
  processTablesForWordCompatibility,
  renderHtmlIncrementally
} from './markdown-processor';

// Import refactored modules
import { BackgroundCacheManagerProxy } from './cache-proxy';
import { createScrollManager } from './scroll-manager';
import { createFileStateManager, getCurrentDocumentUrl, saveToHistory } from './file-state';
import { createAsyncTaskQueue } from './async-task-queue';
import { updateProgress, showProcessingIndicator, hideProcessingIndicator } from './ui/progress-indicator';
import { createTocManager } from './ui/toc-manager';
import { createToolbarManager, generateToolbarHTML, layoutIcons } from './ui/toolbar';

// Extend Window interface for global access
declare global {
  interface Window {
    extensionRenderer: ExtensionRenderer;
    docxExporter: DocxExporter;
    sanitizeRenderedHtml: typeof sanitizeRenderedHtml;
  }
}

/**
 * Layout configuration
 */
interface LayoutConfig {
  maxWidth: string;
  icon: string;
  title: string;
}

/**
 * Layout titles interface
 */
interface LayoutTitles {
  normal: string;
  fullscreen: string;
  narrow: string;
}

/**
 * Layout configurations map
 */
interface LayoutConfigs {
  normal: LayoutConfig;
  fullscreen: LayoutConfig;
  narrow: LayoutConfig;
}

async function initializeContentScript(): Promise<void> {
  // Record page load start time for performance measurement
  const pageLoadStartTime = performance.now();
  const translate = (key: string, substitutions?: string | string[]): string => 
    Localization.translate(key, substitutions);

  // Initialize cache manager with platform
  const cacheManager = new BackgroundCacheManagerProxy(platform);
  
  // Initialize renderer with background cache proxy
  const renderer = new ExtensionRenderer(cacheManager);

  const pluginRenderer: PluginRenderer = {
    render: async (type, content, extraParams, _context) => {
      const result = await renderer.render(type, content, (extraParams || {}) as Record<string, unknown>);

      if (result && (result as { error?: string }).error) {
        throw new Error((result as { error?: string }).error || 'Render failed');
      }

      if (typeof result.width !== 'number' || typeof result.height !== 'number') {
        throw new Error('Render result missing dimensions');
      }

      const format = typeof result.format === 'string' && result.format.length > 0 ? result.format : 'png';

      return {
        base64: result.base64,
        svg: result.svg,
        width: result.width,
        height: result.height,
        format,
        error: result.error
      };
    }
  };

  // Initialize DOCX exporter
  const docxExporter = new DocxExporter(pluginRenderer);

  // Store renderer and utility functions globally for plugins and debugging
  window.extensionRenderer = renderer;
  window.docxExporter = docxExporter;
  window.sanitizeRenderedHtml = sanitizeRenderedHtml;

  // Initialize file state manager
  const { saveFileState, getFileState } = createFileStateManager(platform);

  // Initialize scroll manager
  const scrollManager = createScrollManager(platform, getCurrentDocumentUrl);
  const { cancelScrollRestore, restoreScrollPosition, getSavedScrollPosition } = scrollManager;

  // Initialize TOC manager
  const tocManager = createTocManager(saveFileState, getFileState);
  const { generateTOC, setupTocToggle, updateActiveTocItem, setupResponsiveToc } = tocManager;

  // Initialize async task queue
  const asyncTaskQueueManager = createAsyncTaskQueue(escapeHtml);
  const { asyncTask, processAsyncTasks } = asyncTaskQueueManager;

  // Get the raw markdown content
  const rawMarkdown = document.body.textContent || '';

  // Get saved state early to prevent any flashing
  const initialState = await getFileState();

  // Layout configurations
  const layoutTitles: LayoutTitles = {
    normal: translate('toolbar_layout_title_normal'),
    fullscreen: translate('toolbar_layout_title_fullscreen'),
    narrow: translate('toolbar_layout_title_narrow')
  };

  const layoutConfigs: LayoutConfigs = {
    normal: { maxWidth: '1360px', icon: layoutIcons.normal, title: layoutTitles.normal },
    fullscreen: { maxWidth: '100%', icon: layoutIcons.fullscreen, title: layoutTitles.fullscreen },
    narrow: { maxWidth: '680px', icon: layoutIcons.narrow, title: layoutTitles.narrow }
  };
  
  // Determine initial layout and zoom from saved state
  type LayoutMode = keyof LayoutConfigs;
  const initialLayout: LayoutMode = (initialState.layoutMode && layoutConfigs[initialState.layoutMode as LayoutMode]) 
    ? initialState.layoutMode as LayoutMode
    : 'normal';
  const initialMaxWidth = layoutConfigs[initialLayout].maxWidth;
  const initialZoom = initialState.zoom || 100;
  
  // Default TOC visibility based on screen width if no saved state
  let initialTocVisible: boolean;
  if (initialState.tocVisible !== undefined) {
    initialTocVisible = initialState.tocVisible;
  } else {
    initialTocVisible = window.innerWidth > 1024;
  }
  const initialTocClass = initialTocVisible ? '' : ' hidden';

  const toolbarPrintDisabledTitle = translate('toolbar_print_disabled_title');

  // Initialize toolbar manager
  const toolbarManager = createToolbarManager({
    translate,
    escapeHtml,
    saveFileState,
    getFileState,
    rawMarkdown,
    docxExporter,
    cancelScrollRestore,
    updateActiveTocItem,
    toolbarPrintDisabledTitle
  });

  // Set initial zoom level
  toolbarManager.setInitialZoom(initialZoom);

  // Create a new container for the rendered content
  document.body.innerHTML = generateToolbarHTML({
    translate,
    escapeHtml,
    initialTocClass,
    initialMaxWidth,
    initialZoom
  });

  // Set initial body class for TOC state
  if (!initialTocVisible) {
    document.body.classList.add('toc-hidden');
  }

  // Wait a bit for DOM to be ready, then start processing
  setTimeout(async () => {
    // Get saved scroll position
    const savedScrollPosition = await getSavedScrollPosition();

    // Initialize toolbar
    toolbarManager.initializeToolbar();

    // Parse and render markdown
    await renderMarkdown(rawMarkdown, savedScrollPosition);

    // Save to history after successful render
    await saveToHistory(platform);

    // Setup TOC toggle
    setupTocToggle();

    // Setup keyboard shortcuts
    toolbarManager.setupKeyboardShortcuts();

    // Setup responsive behavior
    await setupResponsiveToc();

    // Now that all DOM is ready, process async tasks
    setTimeout(() => {
      processAsyncTasks(translate, showProcessingIndicator, hideProcessingIndicator, updateProgress);
    }, 200);
  }, 100);

  // Listen for scroll events and save position to background script
  let scrollTimeout: ReturnType<typeof setTimeout>;
  try {
    window.addEventListener('scroll', () => {
      // Update active TOC item
      updateActiveTocItem();
      
      // Debounce scroll saving to avoid too frequent background messages
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        try {
          const currentPosition = window.scrollY || window.pageYOffset;
          saveFileState({
            scrollPosition: currentPosition
          });
        } catch (e) {
          // Ignore errors
        }
      }, 300);
    });
  } catch (e) {
    // Scroll event listener setup failed, continuing without scroll persistence
  }

  async function renderMarkdown(markdown: string, savedScrollPosition = 0): Promise<void> {
    const contentDiv = document.getElementById('markdown-content');

    if (!contentDiv) {
      console.error('markdown-content div not found!');
      return;
    }

    // Load and apply theme
    try {
      const themeId = await themeManager.loadSelectedTheme();
      const theme = await themeManager.loadTheme(themeId);
      await loadAndApplyTheme(themeId);
      
      // Set theme configuration for renderer
      if (theme && theme.fontScheme && theme.fontScheme.body) {
        const fontFamily = themeManager.buildFontFamily(theme.fontScheme.body.fontFamily);
        const fontSize = parseFloat(theme.fontScheme.body.fontSize);
        await renderer.setThemeConfig({
          fontFamily: fontFamily,
          fontSize: fontSize
        });
      }
    } catch (error) {
      console.error('Failed to load theme, using defaults:', error);
    }

    // Pre-process markdown to normalize math blocks and list markers
    let normalizedMarkdown = normalizeMathBlocks(markdown);

    try {
      // Setup markdown processor with async plugins
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkBreaks)
        .use(remarkMath);
      
      // Register all plugins from plugin registry
      // Cast via unknown to satisfy type checking - unified's complex generics make this necessary
      registerRemarkPlugins(processor as unknown as Processor, pluginRenderer, asyncTask, translate, escapeHtml, visit);
      
      // Continue with rehype processing
      processor
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeSlug)
        .use(rehypeHighlight)
        .use(rehypeKatex)
        .use(rehypeStringify, { allowDangerousHtml: true });

      const file = await processor.process(normalizedMarkdown);
      let htmlContent = String(file);

      // Add table centering for better Word compatibility
      htmlContent = processTablesForWordCompatibility(htmlContent);

      // Sanitize HTML before injecting into the document
      htmlContent = sanitizeRenderedHtml(htmlContent);

      // Render incrementally to avoid blocking the main thread
      contentDiv.innerHTML = '';
      await renderHtmlIncrementally(contentDiv, htmlContent, { batchSize: 200, yieldDelay: 0 });

      // Show the content container
      const pageDiv = document.getElementById('markdown-page');
      if (pageDiv) {
        pageDiv.classList.add('loaded');
      }

      // Generate table of contents after rendering
      await generateTOC();

      // Apply initial zoom to ensure scroll margins are correct
      toolbarManager.applyZoom(toolbarManager.getZoomLevel(), false);

      // Restore scroll position immediately
      restoreScrollPosition(savedScrollPosition);
      
      // Update TOC active state initially
      setTimeout(updateActiveTocItem, 100);

    } catch (error) {
      console.error('Markdown processing error:', error);
      console.error('Error stack:', (error as Error).stack);
      contentDiv.innerHTML = `<pre style="color: red; background: #fee; padding: 20px;">Error processing markdown: ${(error as Error).message}\n\nStack:\n${(error as Error).stack}</pre>`;
      restoreScrollPosition(savedScrollPosition);
    }
  }
}

// Message listener interface
interface ContentMessage {
  type?: string;
  locale?: string;
}

platform.message.addListener((message: unknown) => {
  if (!message || typeof message !== 'object') {
    return;
  }
  
  const msg = message as ContentMessage;
  
  if (msg.type === 'localeChanged') {
    const locale = msg.locale || DEFAULT_SETTING_LOCALE;

    Localization.setPreferredLocale(locale)
      .catch((error) => {
        console.error('Failed to update locale in content script:', error);
      })
      .finally(() => {
        window.location.reload();
      });
  } else if (msg.type === 'themeChanged') {
    window.location.reload();
  }
});

Localization.init().catch((error) => {
  console.error('Localization init failed in content script:', error);
}).finally(() => {
  initializeContentScript();
});
