# Android App Signing Guide

## Play Store 上传前的签名配置

### 问题
Google Play Store 拒绝上传使用调试模式签名的 APK/App Bundle。

### 解决方案

#### 1. Keystore 文件
- **位置**: `mobile/android/markdown_viewer.keystore`
- **别名**: `markdown_viewer`
- **生成日期**: 2026-01-07
- **有效期**: 10000 天

#### 2. 签名密钥配置文件
- **位置**: `mobile/android/key.properties`
- **配置项**:
  ```properties
  storePassword=YOUR_PASSWORD_HERE
  keyPassword=YOUR_PASSWORD_HERE
  keyAlias=markdown_viewer
  storeFile=markdown_viewer.keystore
  ```

**⚠️ 重要**: 请将 `YOUR_PASSWORD_HERE` 替换为生成 keystore 时设置的密码

#### 3. Gradle 配置更新
已更新 `build.gradle.kts` 以：
- 读取 `key.properties` 中的签名配置
- 使用发布签名配置构建 release 版本
- 自动对 APK 和 AAB 进行签名

#### 4. 构建命令

使用发布模式构建（已更新）:
```bash
node mobile/build-app.js android
```

或手动构建：
```bash
# APK（可用于直接分发）
flutter build apk --release

# App Bundle（用于 Play Store）
flutter build appbundle --release
```

### 文件结构
```
mobile/
├── android/
│   ├── app/
│   │   └── build.gradle.kts (已更新，包含发布签名配置)
│   ├── markdown_viewer.keystore (签名密钥库)
│   ├── key.properties (签名配置 - 需要填入密码)
│   └── SIGNING_GUIDE.md (本文件)
└── build-app.js (已更新，使用 --release 标志)
```

### 下一步
1. 确保 `key.properties` 中的密码正确
2. 运行 `node mobile/build-app.js android` 构建
3. 输出的 AAB 文件在 `dist/android/` 目录
4. 上传到 Google Play Console

### 安全建议
- 不要将 `markdown_viewer.keystore` 和 `key.properties` 上传到公开仓库
- 已在 `.gitignore` 中添加这些文件（确保已配置）
- 妥善保管 keystore 文件和密码
