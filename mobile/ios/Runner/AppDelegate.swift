import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var pendingFileURL: URL?
  private var fileChannel: FlutterMethodChannel?
  
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    
    // Check if app was launched with a file URL
    if let url = launchOptions?[.url] as? URL {
      pendingFileURL = url
    }
    
    // Disable iOS scrollsToTop on all UIScrollViews to prevent
    // status-bar-tap-to-scroll-to-top triggered by phantom (0,0) touch events on iPad
    UIScrollView.disableScrollsToTopGlobally()
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // Set up method channel using FlutterPluginRegistry API (called after engine is ready)
  override func registrar(forPlugin pluginKey: String) -> FlutterPluginRegistrar? {
    let registrar = super.registrar(forPlugin: pluginKey)
    
    // Initialize file channel on first plugin registration if not yet set up
    if fileChannel == nil, let registrar = registrar {
      setupMethodChannel(with: registrar.messenger())
    }
    
    return registrar
  }
  
  private func setupMethodChannel(with messenger: FlutterBinaryMessenger) {
    fileChannel = FlutterMethodChannel(
      name: "com.xicilion.markdownviewer/file",
      binaryMessenger: messenger
    )
    
    fileChannel?.setMethodCallHandler { [weak self] (call, result) in
      if call.method == "getInitialFile" {
        if let url = self?.pendingFileURL {
          self?.readFileAndReturn(url: url, result: result)
          self?.pendingFileURL = nil
        } else {
          result(nil)
        }
      } else {
        result(FlutterMethodNotImplemented)
      }
    }
  }
  
  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if url.isFileURL {
      // Handle file opened from Files app or other apps
      handleFileURL(url)
      return true
    }
    
    if url.scheme == "markdown-viewer" {
      // Custom URL scheme: markdown-viewer:///path/to/file.md
      // Used for testing via simctl openurl
      let filePath = url.path
      if !filePath.isEmpty {
        let fileURL = URL(fileURLWithPath: filePath)
        handleFileURL(fileURL)
        return true
      }
    }
    
    return super.application(app, open: url, options: options)
  }
  
  private func handleFileURL(_ url: URL) {
    // Need to access security-scoped resource
    let accessing = url.startAccessingSecurityScopedResource()
    defer {
      if accessing {
        url.stopAccessingSecurityScopedResource()
      }
    }
    
    do {
      let content = try String(contentsOf: url, encoding: .utf8)
      let filename = url.lastPathComponent
      
      // Send to Flutter
      fileChannel?.invokeMethod("onFileReceived", arguments: [
        "content": content,
        "filename": filename
      ])
    } catch {
      print("Failed to read file: \(error)")
    }
  }
  
  private func readFileAndReturn(url: URL, result: @escaping FlutterResult) {
    let accessing = url.startAccessingSecurityScopedResource()
    defer {
      if accessing {
        url.stopAccessingSecurityScopedResource()
      }
    }
    
    do {
      let content = try String(contentsOf: url, encoding: .utf8)
      let filename = url.lastPathComponent
      result([
        "content": content,
        "filename": filename
      ])
    } catch {
      print("Failed to read file: \(error)")
      result(nil)
    }
  }
}

// MARK: - Disable scrollsToTop globally
//
// WKWebView's internal UIScrollView has scrollsToTop=true by default.
// On iPad, phantom (0,0) touch events (generated when tapping AppBar buttons)
// fall in the status bar area, causing iOS to trigger scroll-to-top on the
// WKWebView. Flutter's own scroll views don't rely on native scrollsToTop,
// so disabling it globally is safe.
extension UIScrollView {
  private static var _swizzled = false

  @objc static func disableScrollsToTopGlobally() {
    guard !_swizzled else { return }
    _swizzled = true

    let originalSelector = #selector(willMove(toSuperview:))
    let swizzledSelector = #selector(md_willMove(toSuperview:))

    guard let originalMethod = class_getInstanceMethod(UIScrollView.self, originalSelector),
          let swizzledMethod = class_getInstanceMethod(UIScrollView.self, swizzledSelector)
    else { return }

    // willMove(toSuperview:) is inherited from UIView.
    // Use class_addMethod to give UIScrollView its own copy so the
    // exchange only affects UIScrollView, not UIView.
    let didAdd = class_addMethod(
      UIScrollView.self,
      originalSelector,
      method_getImplementation(swizzledMethod),
      method_getTypeEncoding(swizzledMethod)
    )
    if didAdd {
      class_replaceMethod(
        UIScrollView.self,
        swizzledSelector,
        method_getImplementation(originalMethod),
        method_getTypeEncoding(originalMethod)
      )
    } else {
      method_exchangeImplementations(originalMethod, swizzledMethod)
    }
  }

  @objc private func md_willMove(toSuperview newSuperview: UIView?) {
    md_willMove(toSuperview: newSuperview) // calls original (swizzled)
    scrollsToTop = false
  }
}
