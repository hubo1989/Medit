import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    let windowFrame = self.frame
    self.contentViewController = flutterViewController
    self.setFrame(windowFrame, display: true)

    // Set window background to white to prevent black flash on startup
    self.backgroundColor = NSColor.white
    // Also set the Flutter view background to white before first frame renders
    flutterViewController.view.wantsLayer = true
    flutterViewController.view.layer?.backgroundColor = NSColor.white.cgColor

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()
  }
}
