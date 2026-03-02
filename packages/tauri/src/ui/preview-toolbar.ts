/**
 * PreviewToolbar - Toolbar for preview mode
 * Shows mode switcher, find, export (公众号/知乎), and device preview buttons
 */

import type { EditorModeService } from '../editor/index.js';
import type { EditorMode } from '../editor/index.js';
import type { I18nService } from '../i18n/index.js';
import { MODE_ICONS, ACTION_ICONS, DEVICE_ICONS } from './icons.js';

export type DevicePreviewMode = 'desktop' | 'tablet' | 'mobile';
export type ExportTarget = 'wechatMP' | 'zhihu';

export interface PreviewToolbarConfig {
  container: HTMLElement;
  modeService: EditorModeService;
  i18n: I18nService;
  onFindClick?: () => void;
  onExportClick?: (target: ExportTarget) => void;
  onDevicePreviewChange?: (device: DevicePreviewMode) => void;
  onRefreshPreview?: () => void;
}

export class PreviewToolbar {
  private _container: HTMLElement;
  private _modeService: EditorModeService;
  private _i18n: I18nService;
  private _onFindClick?: () => void;
  private _onExportClick?: (target: ExportTarget) => void;
  private _onDevicePreviewChange?: (device: DevicePreviewMode) => void;
  private _onRefreshPreview?: () => void;
  private _buttons: Map<string, HTMLButtonElement> = new Map();
  private _unsubscribe: (() => void) | null = null;
  private _i18nUnsubscribe: (() => void) | null = null;
  private _currentDevice: DevicePreviewMode = 'desktop';

  constructor(config: PreviewToolbarConfig) {
    this._container = config.container;
    this._modeService = config.modeService;
    this._i18n = config.i18n;
    this._onFindClick = config.onFindClick;
    this._onExportClick = config.onExportClick;
    this._onDevicePreviewChange = config.onDevicePreviewChange;
    this._onRefreshPreview = config.onRefreshPreview;

    this._render();
    this._setupEventListeners();
    this._updateActiveButton(this._modeService.getCurrentMode());
    this._updateActiveDeviceButton(this._currentDevice);
    this._updateLabels();
  }

  private _render(): void {
    this._container.className = 'medit-preview-toolbar';

    // Mode switcher
    const editBtn = this._createModeButton('edit', MODE_ICONS.edit, '编辑模式');
    const splitBtn = this._createModeButton('split', MODE_ICONS.split, '分屏模式');
    const previewBtn = this._createModeButton('preview', MODE_ICONS.preview, '预览模式');

    const separator1 = document.createElement('div');
    separator1.className = 'medit-toolbar-separator';

    const findBtn = this._createActionButton('find', ACTION_ICONS.find, '查找替换');

    const separator2 = document.createElement('div');
    separator2.className = 'medit-toolbar-separator';

    // Export buttons: 公众号 + 知乎
    const wechatBtn = this._createActionButton('wechatMP', ACTION_ICONS.wechatMP, '导出公众号格式');
    const zhihuBtn = this._createActionButton('zhihu', ACTION_ICONS.zhihu, '导出知乎格式');

    const separator3 = document.createElement('div');
    separator3.className = 'medit-toolbar-separator';

    // Device preview buttons
    const desktopBtn = this._createDeviceButton('desktop', DEVICE_ICONS.desktop, 'Desktop');
    const tabletBtn = this._createDeviceButton('tablet', DEVICE_ICONS.tablet, 'Tablet');
    const mobileBtn = this._createDeviceButton('mobile', DEVICE_ICONS.mobile, 'Mobile/Wechat');
    const refreshBtn = this._createActionButton('refresh', DEVICE_ICONS.refresh, '刷新预览');

    // Assemble
    this._container.appendChild(editBtn);
    this._container.appendChild(splitBtn);
    this._container.appendChild(previewBtn);
    this._container.appendChild(separator1);
    this._container.appendChild(findBtn);
    this._container.appendChild(separator2);
    this._container.appendChild(wechatBtn);
    this._container.appendChild(zhihuBtn);
    this._container.appendChild(separator3);
    this._container.appendChild(desktopBtn);
    this._container.appendChild(tabletBtn);
    this._container.appendChild(mobileBtn);
    this._container.appendChild(refreshBtn);
  }

  private _createModeButton(mode: EditorMode, icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-preview-btn medit-mode-btn';
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
    button.className = 'medit-preview-btn';
    button.title = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    this._buttons.set(name, button);
    return button;
  }

  private _createDeviceButton(device: DevicePreviewMode, icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'medit-preview-btn medit-device-btn';
    button.dataset.device = device;
    button.title = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    this._buttons.set(`device-${device}`, button);
    return button;
  }

  private _setupEventListeners(): void {
    for (const mode of ['edit', 'split', 'preview'] as EditorMode[]) {
      this._buttons.get(mode)?.addEventListener('click', () => this._modeService.switchMode(mode));
    }

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

    this._buttons.get('refresh')?.addEventListener('click', () => this._onRefreshPreview?.());

    this._unsubscribe = this._modeService.onModeChange((newMode) => this._updateActiveButton(newMode));
    this._i18nUnsubscribe = this._i18n.onLanguageChange(() => this._updateLabels());
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
    this._buttons.clear();
    this._container.innerHTML = '';
  }
}

export default PreviewToolbar;
