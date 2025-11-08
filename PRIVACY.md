# 隐私政策

**最后更新日期：2025年11月8日**

## 概述

Markdown Viewer（以下简称"本扩展"）尊重并保护用户隐私。本隐私政策说明了本扩展如何处理用户信息。

## 数据收集

**本扩展不收集、存储或传输任何用户个人数据。**

具体来说，本扩展：

- ❌ **不收集**个人身份信息（姓名、邮箱、地址等）
- ❌ **不收集**健康信息
- ❌ **不收集**财务和付款信息
- ❌ **不收集**身份验证信息（密码、凭据等）
- ❌ **不收集**个人通讯内容
- ❌ **不收集**位置信息
- ❌ **不收集**网络浏览记录
- ❌ **不收集**用户活动数据
- ❌ **不收集**网站内容

## 本地数据存储

本扩展使用浏览器的本地存储功能（Chrome Storage API）来保存以下信息，这些信息**仅存储在您的设备上**，不会上传到任何服务器：

1. **渲染缓存**：Mermaid 图表和复杂 HTML/SVG 转换后的 PNG 图片，用于提高重复打开文档的加载速度
2. **用户设置**：
   - 文档阅读位置（滚动位置）
   - 缩放级别设置
   - 页面布局偏好

这些数据完全存储在本地，用户可以随时通过清除浏览器缓存来删除。

## 权限使用说明

本扩展请求以下权限，仅用于实现核心功能：

### storage & unlimitedStorage
用于在本地缓存渲染后的图片和用户设置，不涉及任何数据上传。

### offscreen
用于在后台渲染 Markdown 内容，包括将 Mermaid 图表转换为 PNG 图片，所有处理均在本地完成。

### scripting
用于在打开 Markdown 文件时注入渲染脚本，将 Markdown 转换为格式化的 HTML 显示。

### tabs
用于检测当前标签页是否打开了 Markdown 文件，以及获取文档标题用于导出文件命名。

### downloads
用于将 Markdown 文档导出为 Word (.docx) 格式并保存到本地。

### 主机权限 (file://, http://, https://)
用于访问本地 Markdown 文件以及在线的 Markdown 文件（如 GitHub、GitLab 等平台上的文档）。

## 数据共享

**本扩展不与任何第三方共享用户数据。**

本扩展：
- ✅ 完全在本地运行
- ✅ 不包含任何分析或追踪代码
- ✅ 不使用任何远程服务器
- ✅ 不向任何第三方发送数据

## 数据安全

由于本扩展不收集或传输任何用户数据，因此不存在数据泄露风险。所有处理操作均在用户设备本地完成。

## 用户权利

用户可以随时：
- 通过浏览器设置清除本扩展存储的本地缓存
- 卸载本扩展以移除所有本地存储数据
- 在扩展设置中管理权限

## 儿童隐私

本扩展不针对13岁以下儿童，也不会有意收集儿童的个人信息。

## 政策变更

如果本隐私政策有任何变更，我们会在此页面更新，并修改"最后更新日期"。建议用户定期查看本政策。

## 联系方式

如对本隐私政策有任何疑问，请通过以下方式联系：

- GitHub Issues: https://github.com/xicilion/markdown-viewer-extension/issues
- Email: xicilion@gmail.com

---

## Privacy Policy (English)

**Last Updated: November 8, 2025**

## Overview

Markdown Viewer ("the Extension") respects and protects user privacy. This privacy policy explains how the Extension handles user information.

## Data Collection

**The Extension does NOT collect, store, or transmit any personal user data.**

Specifically, the Extension:

- ❌ Does NOT collect personal identification information
- ❌ Does NOT collect health information
- ❌ Does NOT collect financial and payment information
- ❌ Does NOT collect authentication information
- ❌ Does NOT collect personal communications
- ❌ Does NOT collect location information
- ❌ Does NOT collect web browsing history
- ❌ Does NOT collect user activity data
- ❌ Does NOT collect website content

## Local Data Storage

The Extension uses browser's local storage (Chrome Storage API) to save the following information **only on your device**, which is never uploaded to any server:

1. **Rendering Cache**: PNG images converted from Mermaid diagrams and complex HTML/SVG content, used to improve loading speed when reopening documents
2. **User Settings**:
   - Document reading position (scroll position)
   - Zoom level settings
   - Page layout preferences

This data is stored completely locally and can be deleted at any time by clearing browser cache.

## Permissions Usage

The Extension requests the following permissions solely for core functionality:

### storage & unlimitedStorage
Used to cache rendered images and user settings locally, no data uploading involved.

### offscreen
Used to render Markdown content in the background, including converting Mermaid diagrams to PNG images, all processing done locally.

### scripting
Used to inject rendering scripts when opening Markdown files, converting Markdown to formatted HTML display.

### tabs
Used to detect if the current tab has opened a Markdown file, and to get document title for export file naming.

### downloads
Used to export Markdown documents to Word (.docx) format and save locally.

### Host Permissions (file://, http://, https://)
Used to access local Markdown files and online Markdown files (such as documents on GitHub, GitLab platforms).

## Data Sharing

**The Extension does NOT share user data with any third parties.**

The Extension:
- ✅ Runs completely locally
- ✅ Contains no analytics or tracking code
- ✅ Uses no remote servers
- ✅ Sends no data to any third parties

## Data Security

Since the Extension does not collect or transmit any user data, there is no risk of data breach. All processing operations are completed locally on the user's device.

## User Rights

Users can at any time:
- Clear the Extension's local cache through browser settings
- Uninstall the Extension to remove all local storage data
- Manage permissions in extension settings

## Children's Privacy

The Extension is not directed to children under 13 and does not knowingly collect personal information from children.

## Policy Changes

If there are any changes to this privacy policy, we will update this page and modify the "Last Updated" date. Users are encouraged to review this policy regularly.

## Contact

For any questions about this privacy policy, please contact:

- GitHub Issues: https://github.com/xicilion/markdown-viewer-extension/issues
- Email: xicilion@gmail.com
