import 'package:shared_preferences/shared_preferences.dart';

/// Service for persisting user settings
class SettingsService {
  static const String _keyTheme = 'theme';
  static const String _keyFontSize = 'fontSize';
  static const String _keyHrPageBreak = 'hrPageBreak';
  static const String _keyLocale = 'locale';

  SharedPreferences? _prefs;

  /// Initialize the settings service
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Theme
  String get theme => _prefs?.getString(_keyTheme) ?? 'default';
  set theme(String value) => _prefs?.setString(_keyTheme, value);

  // Font size
  int get fontSize => _prefs?.getInt(_keyFontSize) ?? 16;
  set fontSize(int value) => _prefs?.setInt(_keyFontSize, value);

  // HR as page break in DOCX export
  bool get hrPageBreak => _prefs?.getBool(_keyHrPageBreak) ?? true;
  set hrPageBreak(bool value) => _prefs?.setBool(_keyHrPageBreak, value);

  // Locale
  String get locale => _prefs?.getString(_keyLocale) ?? 'system';
  set locale(String value) => _prefs?.setString(_keyLocale, value);

  /// Get all settings as a map
  Map<String, dynamic> toMap() {
    return {
      'theme': theme,
      'fontSize': fontSize,
      'hrPageBreak': hrPageBreak,
      'locale': locale,
    };
  }
}

/// Global settings service instance
final settingsService = SettingsService();
