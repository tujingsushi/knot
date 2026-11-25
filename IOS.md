# 结绳 KNOT iOS 版

iOS 工程已通过 Capacitor 8 生成，使用 **Swift Package Manager**，不再依赖 CocoaPods。

- Bundle ID：`com.sancheng.app`
- 显示名称：`结绳`
- Marketing Version：`2.7.0`
- Build：`1`
- 最低系统：iOS 15
- 设备：iPhone，竖屏
- 图标：`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`（1024 × 1024）
- 启动画面：纯纸色，无图标、无名称；进入后仍然只显示名言页

## 重要限制

**Windows 不能编译 IPA。**

iOS 应用必须在 macOS 上使用 Xcode 构建、签名和安装。当前工作区已经包含完整的 iOS 工程，但没有生成或验证 IPA，也没有在 iPhone 真机上运行过。

iOS 真机安装需要：

- 一台 macOS 电脑
- Xcode 16 或更新版本
- Apple ID / Apple Developer Team
- 真机安装：免费 Apple ID 也可通过 Xcode 个人 Team 安装，证书通常 7 天有效
- TestFlight / App Store：需要付费 Apple Developer Program（99 美元/年）

## 在 macOS 上运行

```bash
npm install
npm run build
npx cap sync ios
npm run ios:open
```

然后在 Xcode 中：

1. 选择 `App` target
2. 打开 **Signing & Capabilities**
3. 选择你的 Team
4. 如果 `com.sancheng.app` 已被占用，改成你自己的 Bundle ID，例如 `com.tujingsushi.knot`
5. 连接 iPhone，选择设备，点击 Run

`npm run ios:sync` 等价于：

```bash
npm run build
npx cap sync ios
```

Windows 上也可以运行 `npx cap sync ios` 复制 Web 资源和生成配置，但不能编译 Xcode 工程。

## 生成 IPA / TestFlight

在 macOS 的 Xcode 中：

1. 选择 **Any iOS Device (arm64)**
2. Product → Archive
3. Organizer → Distribute App
4. 选择 **App Store Connect** 或 **Ad Hoc**
5. 上传到 App Store Connect 后，在 TestFlight 中邀请测试

没有 Apple Developer 证书和 provisioning profile 时，不能生成可分发的 IPA。

## GitHub Actions

仓库提供 [`.github/workflows/ios-build.yml`](../.github/workflows/ios-build.yml)：

- 运行环境：macOS 15
- 只构建 **iOS Simulator** 版本
- 不需要签名证书
- 产物是模拟器 `.app`，不能直接安装到 iPhone
- 在 GitHub Actions 页面手动运行 **iOS simulator build**

这是用于检查 Swift 编译和资源是否正常的 CI，不是 App Store 发布流程。

## 工程结构

```text
ios/
  App/
    App.xcodeproj/            Xcode 工程
    App/
      AppDelegate.swift
      SceneDelegate.swift
      Info.plist
      Assets.xcassets/
        AppIcon.appiconset/   1024 图标
        Splash.imageset/      纯纸色启动图
      Base.lproj/
        LaunchScreen.storyboard
        Main.storyboard
    CapApp-SPM/               Capacitor Swift Package
```

## iOS 适配

- 竖屏 iPhone
- 浅色状态栏文字（深色内容）
- `viewport-fit=cover` + safe-area CSS
- `contentInset: "never"`，页面自行处理刘海和 Home Indicator
- 原生文件存储 + WebView 本地存储
- JSON 备份通过系统分享面板导出
- 设置页会显示「iOS App」
- 不注册 Service Worker
- 不使用远程页面

## App Store 准备

- 隐私政策：[`PRIVACY.md`](../PRIVACY.md)
- App 名称建议：`结绳 KNOT`
- 副标题：`把远方拆成今天`
- 分类：效率 / Productivity
- 年龄分级：4+
- App 隐私：Data Not Collected
- 加密声明：`ITSAppUsesNonExemptEncryption = false`
- 需要提供 App Store 截图（iPhone 6.7"/6.5" 等）
- 需要 Apple Developer Program 账号

## 当前验证状态

已完成：

- Capacitor iOS 工程生成
- SPM 依赖配置
- iOS AppIcon 与纯纸色启动图
- Info.plist 显示名、竖屏、语言、加密声明
- 状态栏样式代码
- GitHub Actions 模拟器构建工作流

未完成：

- 没有 macOS/Xcode，未编译 iOS 工程
- 没有 IPA
- 没有在 iPhone 真机或模拟器运行
- 没有 App Store 签名和上传

