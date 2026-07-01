// ================================================================
//  EduVerse — Flutter WebView Wrapper  (main.dart)
//  استخدم هذا الملف لتغليف تطبيق Capacitor داخل Flutter
//  إذا أردت الاستمرار مع Capacitor مباشرة، تجاهل هذا الملف.
// ================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // إخفاء شريط الحالة وشريط التنقل لتجربة ملء الشاشة
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Color(0x0005050f),
      systemNavigationBarColor: Colors.transparent,
    ),
  );

  // قفل الاتجاه عموديًا
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(const EduVerseApp());
}

class EduVerseApp extends StatelessWidget {
  const EduVerseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduVerse',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF97316),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF05050F),
      ),
      home: const EduVerseWebView(),
    );
  }
}

class EduVerseWebView extends StatefulWidget {
  const EduVerseWebView({super.key});

  @override
  State<EduVerseWebView> createState() => _EduVerseWebViewState();
}

class _EduVerseWebViewState extends State<EduVerseWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF05050F))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _isLoading = true),
          onPageFinished: (_) => setState(() => _isLoading = false),
          onWebResourceError: (error) {
            debugPrint('WebView error: ${error.description}');
          },
        ),
      )
      // ─── غيّر هذا العنوان لعنوان الخادم الفعلي ───
      ..loadRequest(Uri.parse('http://localhost:5173'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF05050F),
      body: SafeArea(
        top: false,
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            // شاشة تحميل أولية
            if (_isLoading)
              Container(
                color: const Color(0xFF05050F),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'EDUVERSE',
                        style: TextStyle(
                          fontFamily: 'Anton',
                          fontSize: 28,
                          color: Colors.white,
                          letterSpacing: 2,
                        ),
                      ),
                      SizedBox(height: 24),
                      SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(
                          color: Color(0xFFF97316),
                          strokeWidth: 2.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ════════════════════════════════════════
//  pubspec.yaml dependencies المطلوبة:
// ════════════════════════════════════════
//
//  dependencies:
//    flutter:
//      sdk: flutter
//    webview_flutter: ^4.7.0
//
//  android {
//    compileSdk = 35
//    defaultConfig { minSdk = 21 }
//  }
