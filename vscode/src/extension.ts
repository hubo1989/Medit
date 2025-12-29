/**
 * VS Code Extension Entry Point
 * 
 * Main entry point for the Markdown Viewer Advanced extension.
 */

import * as vscode from 'vscode';
import { MarkdownPreviewPanel } from './preview-panel';
import { ExtensionCacheService } from './cache-service';

let outputChannel: vscode.OutputChannel;
let cacheService: ExtensionCacheService;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Markdown Viewer Advanced');
  outputChannel.appendLine('Markdown Viewer Advanced is now active');

  // Initialize cache service
  cacheService = new ExtensionCacheService(context);
  cacheService.init().catch(err => {
    outputChannel.appendLine(`Cache service init error: ${err}`);
  });

  // Register preview command
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownViewer.preview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        MarkdownPreviewPanel.createOrShow(context.extensionUri, editor.document, cacheService);
      } else {
        vscode.window.showWarningMessage('Please open a Markdown file first');
      }
    })
  );

  // Register preview to side command
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownViewer.previewToSide', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        MarkdownPreviewPanel.createOrShow(context.extensionUri, editor.document, cacheService, vscode.ViewColumn.Beside);
      } else {
        vscode.window.showWarningMessage('Please open a Markdown file first');
      }
    })
  );

  // Register export to DOCX command
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownViewer.exportDocx', async () => {
      const panel = MarkdownPreviewPanel.currentPanel;
      if (panel) {
        await panel.exportToDocx();
      } else {
        vscode.window.showWarningMessage('Please open the Markdown preview first');
      }
    })
  );

  // Register refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownViewer.refresh', () => {
      const panel = MarkdownPreviewPanel.currentPanel;
      if (panel) {
        panel.refresh();
      }
    })
  );

  // Register open settings command
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownViewer.openSettings', () => {
      const panel = MarkdownPreviewPanel.currentPanel;
      if (panel) {
        panel.openSettings();
      }
    })
  );

  // Auto-update preview on document change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === 'markdown') {
        const panel = MarkdownPreviewPanel.currentPanel;
        if (panel && panel.isDocumentMatch(e.document)) {
          panel.updateContent(e.document.getText());
        }
      }
    })
  );

  // Auto-update preview on active editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'markdown') {
        const panel = MarkdownPreviewPanel.currentPanel;
        if (panel) {
          panel.setDocument(editor.document);
        }
      }
    })
  );

  outputChannel.appendLine('Commands registered successfully');
}

export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}
