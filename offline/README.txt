Turtle Lab - offline copy
=========================

This folder runs Turtle Lab with no internet connection.

1. Copy the whole "offline" folder (app.html and the libs folder together) to any computer or USB stick.
2. Double-click app.html to open it in Chrome, Edge, Firefox or Safari.

If copying code or saving files does not work when opened by double-click, serve the folder instead:
    python -m http.server 8000      (run inside this folder, then open http://localhost:8000/app.html)

Notes
- Progress and saved code are stored in the browser, per location. The offline copy does not share
  progress with the online site or with another copy of this folder at a different path.
- Do not edit app.html here. It is generated from ../app.html by tools/build-offline.mjs.
- Skulpt 1.2.0 (libs/) is MIT licensed; see libs/LICENSE-skulpt.txt.

---

نسخة Turtle Lab للعمل بدون إنترنت

1. انسخ مجلد "offline" كاملًا (الملف app.html مع المجلد libs) إلى أي جهاز أو ذاكرة USB.
2. افتح الملف app.html بالنقر المزدوج في متصفح Chrome أو Edge أو Firefox أو Safari.

يُحفَظ التقدّم والكود داخل المتصفح حسب مكان الملف، لذلك لا تتشارك هذه النسخة التقدّم مع الموقع على الإنترنت.
