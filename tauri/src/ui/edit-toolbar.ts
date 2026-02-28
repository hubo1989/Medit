/**
 * EditToolbar - Toolbar buttons for edit/split mode
 * Includes mode switcher, edit actions, diagram insertion, and export functions
 */

import type { EditorModeService } from '../editor/index.js';
import type { EditorMode } from '../editor/index.js';
import type { I18nService } from '../i18n/index.js';
import { MODE_ICONS, ACTION_ICONS, DEVICE_ICONS, EDIT_ICONS } from './icons.js';
import { DiagramMenu } from './diagram-menu.js';

export type DevicePreviewMode = 'desktop' | 'tablet' | 'mobile';
export type ExportTarget = 'wechatMP' | 'zhihu';
export type EditAction =
  | 'bold' | 'italic' | 'strikethrough' | 'inlineCode'
  | 'heading1' | 'heading2' | 'heading3'
  | 'codeBlock' | 'quote' | 'horizontalRule'
  | 'link' | 'image'
  | 'unorderedList' | 'orderedList' | 'taskList'
  | 'undo' | 'redo';

export interface EditToolbarConfig {
  container: HTMLElement;
  modeService: EditorModeService;
  i18n: I18nService;
  onFindClick?: () => void;
  onExportClick?: (target: ExportTarget) => void;
  onDevicePreviewChange?: (device: DevicePreviewMode) => void;
  onRefreshPreview?: () => void;
  onEditAction?: (action: EditAction) => void;
  onInsertDiagram?: (template: string) => void;
}

export class EditToolbar {
  private _container: HTMLElement;
  private _modeService: EditorModeService;
  private _i18n: I18nService;
  private _onFindClick?: () => void;
  private _onExportClick?: (target: ExportTarget) => void;
  private _onDevicePreviewChange?: (device: DevicePreviewMode) => void;
  private _onRefreshPreview?: () => void;
  private _onEditAction?: (action: EditAction) => void;
  private _onInsertDiagram?: (template: string) => void;
  private _buttons: Map<string, HTMLButtonElement> = new Map();
  private _unsubscribe: (() => void) | null = null;
  private _i18nUnsubscribe: (() => void) | null = null;
  private _currentDevice: DevicePreviewMode = 'desktop';
  /** Group of buttons only visible in split/preview mode */
  private _previewOnlyGroup: HTMLElement | null = null;
  /** Diagram menu instance */
  private _diagramMenu: DiagramMenu | null = null;

  constructor(config: EditToolbarConfig) {
    this._container = config.container;
    this._modeService = config.modeService;
    this._i18n = config.i18n;
    this._onFindClick = config.onFindClick;
    this._onExportClick = config.onExportClick;
    this._onDevicePreviewChange = config.onDevicePreviewChange;
    this._onRefreshPreview = config.onRefreshPreview;
    this._onEditAction = config.onEditAction;
    this._onInsertDiagram = config.onInsertDiagram;

    this._render();
    this._setupEventListeners();

    const currentMode = this._modeService.getCurrentMode();
    this._updateActiveButton(currentMode);
    this._updateActiveDeviceButton(this._currentDevice);
    this._updatePreviewOnlyVisibility(currentMode);
    this._updateLabels();
  }

  private _render(): void {
    this._container.className = 'medit-edit-toolbar';

    // --- Mode buttons (always visible) ---
    const editBtn = this._createModeButton('edit', MODE_ICONS.edit, '编辑模式');
    const splitBtn = this._createModeButton('split', MODE_ICONS.split, '分屏模式');
    const previewBtn = this._createModeButton('preview', MODE_ICONS.preview, '预览模式');

    const separator1 = this._createSeparator();

    // --- Edit action buttons ---
    const editActionGroup = this._createEditActionGroup();

    const separator2 = this._createSeparator();

    // --- Find button ---
    const findBtn = this._createActionButton('find', ACTION_ICONS.find, '查找替换');

    const separator3 = this._createSeparator();

    // --- Preview-only group (hidden in edit mode) ---
    this._previewOnlyGroup = document.createElement('div');
    this._previewOnlyGroup.className = 'medit-preview-only-group';
    this._previewOnlyGroup.style.display = 'contents';

    // Export buttons: 公众号 + 知乎
    const wechatBtn = this._createActionButton('wechatMP', ACTION_ICONS.wechatMP, '导出公众号格式');
    const zhihuBtn = this._createActionButton('zhihu', ACTION_ICONS.zhihu, '导出知乎格式');

    const separator4 = this._createSeparator();

    // Device preview buttons
    const desktopBtn = this._createDeviceButton('desktop', DEVICE_ICONS.desktop, 'Desktop');
    const tabletBtn = this._createDeviceButton('tablet', DEVICE_ICONS.tablet, 'Tablet');
    const mobileBtn = this._createDeviceButton('mobile', DEVICE_ICONS.mobile, 'Mobile/Wechat');
    const refreshBtn = this._createActionButton('refresh', DEVICE_ICONS.refresh, '刷新预览');

    // Assemble preview-only group
    this._previewOnlyGroup.appendChild(wechatBtn);
    this._previewOnlyGroup.appendChild(zhihuBtn);
    this._previewOnlyGroup.appendChild(separator4);
    this._previewOnlyGroup.appendChild(desktopBtn);
    this._previewOnlyGroup.appendChild(tabletBtn);
    this._previewOnlyGroup.appendChild(mobileBtn);
    this._previewOnlyGroup.appendChild(refreshBtn);

    // Assemble container
    this._container.appendChild(editBtn);
    this._container.appendChild(splitBtn);
    this._container.appendChild(previewBtn);
    this._container.appendChild(separator1);
    this._container.appendChild(editActionGroup);
    this._container.appendChild(separator2);
    this._container.appendChild(findBtn);
    this._container.appendChild(separator3);
    this._container.appendChild(this._previewOnlyGroup);
  }

  /**
   * Create edit action button group
   */
  private _createEditActionGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'medit-edit-action-group';

    // Heading buttons
    const heading1Btn = this._createEditActionButton('heading1', EDIT_ICONS.heading, '标题1 (Ctrl+1)');
    const heading2Btn = this._createEditActionButton('heading2', EDIT_ICONS.heading, '标题2 (Ctrl+2)');
    const heading3Btn = this._createEditActionButton('heading3', EDIT_ICONS.heading, '标题3 (Ctrl+3)');

    // Text formatting
    const boldBtn = this._createEditActionButton('bold', EDIT_ICONS.bold, '加粗 (Ctrl+B)');
    const italicBtn = this._createEditActionButton('italic', EDIT_ICONS.italic, '斜体 (Ctrl+I)');
    const strikethroughBtn = this._createEditActionButton('strikethrough', EDIT_ICONS.strikethrough, '删除线');

    // Code
    const codeBtn = this._createEditActionButton('codeBlock', EDIT_ICONS.code, '代码块');
    const inlineCodeBtn = this._createEditActionButton('inlineCode', EDIT_ICONS.inlineCode, '行内代码');

    // Links and media
    const linkBtn = this._createEditActionButton('link', EDIT_ICONS.link, '链接 (Ctrl+K)');
    const imageBtn = this._createEditActionButton('image', EDIT_ICONS.image, '图片');

    // Block elements
    const quoteBtn = this._createEditActionButton('quote', EDIT_ICONS.quote, '引用');
    const horizontalRuleBtn = this._createEditActionButton('horizontalRule', EDIT_ICONS.horizontalRule, '分隔线');

    // Lists
    const unorderedListBtn = this._createEditActionButton('unorderedList', EDIT_ICONS.list, '无序列表');
    const orderedListBtn = this._createEditActionButton('orderedList', EDIT_ICONS.orderedList, '有序列表');
    const taskListBtn = this._createEditActionButton('taskList', EDIT_ICONS.taskList, '任务列表');

    // Undo/Redo
    const undoBtn = this._createEditActionButton('undo', EDIT_ICONS.undo, '撤销 (Ctrl+Z)');
    const redoBtn = this._createEditActionButton('redo', EDIT_ICONS.redo, '重做 (Ctrl+Y)');

    // Diagram menu
    this._diagramMenu = new DiagramMenu({
      onSelect: (template) => this._onInsertDiagram?.(template),
    });
    const diagramBtn = this._diagramMenu.createButton();

    // Append buttons in logical groups
    group.appendChild(heading1Btn);
    group.appendChild(heading2Btn);
    group.appendChild(heading3Btn);
    group.appendChild(boldBtn);
    group.appendChild(italicBtn);
    group.appendChild(strikethroughBtn);
    group.appendChild(inlineCodeBtn);
    group.appendChild(codeBtn);
    group.appendChild(linkBtn);
    group.appendChild(imageBtn);
    group.appendChild(quoteBtn);
    group.appendChild(horizontalRuleBtn);
    group.appendChild(unorderedListBtn);
    group.appendChild(orderedListBtn);
    group.appendChild(taskListBtn);
    group.appendChild(diagramBtn);
    group.appendChild(undoBtn);
    group.appendChild(redoBtn);

    return group;
  }

  /**
   * Create an edit action button
   */
  private _createEditActionButton(action: EditAction, icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-edit-btn';
    button.title = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    button.dataset.action = action;
    this._buttons.set(action, button);
    return button;
  }

  /**
   * Create a toolbar separator
   */
  private _createSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'medit-toolbar-separator';
    return separator;
  }

  private _createModeButton(mode: EditorMode, icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-edit-btn medit-mode-btn';
    button.dataset.mode = mode;
    button.title = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    this._buttons.set(mode, button);
    return button;
  }

  private _createActionButton(name: string, icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-edit-btn';
    button.title = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    this._buttons.set(name, button);
    return button;
  }

  private _createDeviceButton(device: DevicePreviewMode, icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-edit-btn medit-device-btn';
    button.dataset.device = device;
    button.title = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    this._buttons.set(`device-${device}`, button);
    return button;
  }

  private _setupEventListeners(): void {
    // Mode switch
    for (const mode of ['edit', 'split', 'preview'] as EditorMode[]) {
      this._buttons.get(mode)?.addEventListener('click', () => this._modeService.switchMode(mode));
    }

    // Edit actions
    const editActions: EditAction[] = [
      'bold', 'italic', 'strikethrough', 'inlineCode',
      'heading1', 'heading2', 'heading3',
      'codeBlock', 'quote', 'horizontalRule',
      'link', 'image',
      'unorderedList', 'orderedList', 'taskList',
      'undo', 'redo',
    ];
    for (const action of editActions) {
      this._buttons.get(action)?.addEventListener('click', () => this._onEditAction?.(action));
    }

    // Find
    this._buttons.get('find')?.addEventListener('click', () => this._onFindClick?.());

    // Export: 公众号 / 知乎
    this._buttons.get('wechatMP')?.addEventListener('click', () => this._onExportClick?.('wechatMP'));
    this._buttons.get('zhihu')?.addEventListener('click', () => this._onExportClick?.('zhihu'));

    // Device preview
    for (const device of ['desktop', 'tablet', 'mobile'] as DevicePreviewMode[]) {
      this._buttons.get(`device-${device}`)?.addEventListener('click', () => {
        this._currentDevice = device;
        this._updateActiveDeviceButton(device);
        this._onDevicePreviewChange?.(device);
      });
    }

    // Refresh
    this._buttons.get('refresh')?.addEventListener('click', () => this._onRefreshPreview?.());

    // Subscribe to mode changes
    this._unsubscribe = this._modeService.onModeChange((newMode) => {
      this._updateActiveButton(newMode);
      this._updatePreviewOnlyVisibility(newMode);
    });

    this._i18nUnsubscribe = this._i18n.onLanguageChange(() => this._updateLabels());
  }

  /** Hide device/export buttons in edit mode, show in split/preview */
  private _updatePreviewOnlyVisibility(mode: EditorMode): void {
    if (!this._previewOnlyGroup) return;
    this._previewOnlyGroup.style.display = mode === 'edit' ? 'none' : 'contents';
  }

  private _updateActiveButton(activeMode: EditorMode): void {
    for (const mode of ['edit', 'split', 'preview'] as EditorMode[]) {
      const btn = this._buttons.get(mode);
      if (btn) {
        btn.classList.toggle('active', mode === activeMode);
        btn.setAttribute('aria-pressed', String(mode === activeMode));
      }
    }
  }

  private _updateActiveDeviceButton(activeDevice: DevicePreviewMode): void {
    for (const device of ['desktop', 'tablet', 'mobile'] as DevicePreviewMode[]) {
      const btn = this._buttons.get(`device-${device}`);
      if (btn) {
        btn.classList.toggle('active', device === activeDevice);
        btn.setAttribute('aria-pressed', String(device === activeDevice));
      }
    }
  }

  setDevice(device: DevicePreviewMode): void {
    if (this._currentDevice !== device) {
      this._currentDevice = device;
      this._updateActiveDeviceButton(device);
    }
  }

  updateLabels(): void { this._updateLabels(); }

  private _updateLabels(): void {
    // Mode buttons
    const editBtn = this._buttons.get('edit');
    const splitBtn = this._buttons.get('split');
    const previewBtn = this._buttons.get('preview');
    const findBtn = this._buttons.get('find');
    const wechatBtn = this._buttons.get('wechatMP');
    const zhihuBtn = this._buttons.get('zhihu');
    const desktopBtn = this._buttons.get('device-desktop');
    const tabletBtn = this._buttons.get('device-tablet');
    const mobileBtn = this._buttons.get('device-mobile');
    const refreshBtn = this._buttons.get('refresh');

    if (editBtn) editBtn.title = this._i18n.getModeLabel('edit');
    if (splitBtn) splitBtn.title = this._i18n.getModeLabel('split');
    if (previewBtn) previewBtn.title = this._i18n.getModeLabel('preview');
    if (findBtn) findBtn.title = this._i18n.t('findReplace.find') + ' (Ctrl+F / Cmd+F)';
    if (wechatBtn) wechatBtn.title = this._i18n.t('toolbar.wechatMP');
    if (zhihuBtn) zhihuBtn.title = this._i18n.t('toolbar.zhihu');
    if (desktopBtn) desktopBtn.title = this._i18n.t('toolbar.desktop');
    if (tabletBtn) tabletBtn.title = this._i18n.t('toolbar.tablet');
    if (mobileBtn) mobileBtn.title = this._i18n.t('toolbar.mobile');
    if (refreshBtn) refreshBtn.title = this._i18n.t('toolbar.refresh');

    // Edit action buttons
    const editActionLabels: Record<string, () => string> = {
      heading1: () => this._i18n.t('toolbar.heading1') + ' (Ctrl+1)',
      heading2: () => this._i18n.t('toolbar.heading2') + ' (Ctrl+2)',
      heading3: () => this._i18n.t('toolbar.heading3') + ' (Ctrl+3)',
      bold: () => this._i18n.t('toolbar.bold') + ' (Ctrl+B)',
      italic: () => this._i18n.t('toolbar.italic') + ' (Ctrl+I)',
      strikethrough: () => this._i18n.t('toolbar.strikethrough'),
      codeBlock: () => this._i18n.t('toolbar.codeBlock'),
      inlineCode: () => this._i18n.t('toolbar.inlineCode'),
      link: () => this._i18n.t('toolbar.link') + ' (Ctrl+K)',
      image: () => this._i18n.t('toolbar.image'),
      quote: () => this._i18n.t('toolbar.quote'),
      horizontalRule: () => this._i18n.t('toolbar.horizontalRule'),
      unorderedList: () => this._i18n.t('toolbar.unorderedList'),
      orderedList: () => this._i18n.t('toolbar.orderedList'),
      taskList: () => this._i18n.t('toolbar.taskList'),
      undo: () => this._i18n.t('toolbar.undo') + ' (Ctrl+Z)',
      redo: () => this._i18n.t('toolbar.redo') + ' (Ctrl+Y)',
    };

    for (const [action, getLabel] of Object.entries(editActionLabels)) {
      const btn = this._buttons.get(action);
      if (btn) {
        try {
          btn.title = getLabel();
        } catch {
          // i18n key might not exist, keep current label
        }
      }
    }

    // Update aria-labels
    this._buttons.forEach(btn => {
      if (btn.title) {
        btn.setAttribute('aria-label', btn.title);
      }
    });
  }

  destroy(): void {
    this._unsubscribe?.();
    this._i18nUnsubscribe?.();
    this._diagramMenu?.destroy();
    this._buttons.clear();
    this._container.innerHTML = '';
  }
}

export default EditToolbar;
