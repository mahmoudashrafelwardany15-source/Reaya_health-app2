# رعاية Pro + Gemini API

مشروع تجريبي عربي RTL، بواجهة رعاية وBackend Node.js يربط المساعد الصحي بـ Gemini عبر Interactions API. مفتاح API محفوظ في الخادم وليس في HTML.

## المتطلبات
- Node.js 20 أو أحدث
- اتصال إنترنت
- Gemini API Key من https://aistudio.google.com/apikey

## التشغيل على Windows / macOS / Linux
1. فك ضغط المجلد.
2. افتح Terminal داخل المجلد.
3. نفّذ `npm install`.
4. انسخ `.env.example` إلى ملف جديد اسمه `.env`.
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
5. افتح `.env` وضع مفتاحك بعد `GEMINI_API_KEY=`.
6. شغّل `npm start`.
7. افتح `http://localhost:3000` في المتصفح.

لا تفتح `public/index.html` مباشرة من file://؛ افتح الموقع عبر عنوان localhost أعلاه.

## اختبار اتصال الخادم
افتح `http://localhost:3000/api/health`. ستظهر حالة وجود المفتاح واسم النموذج. هذا لا يثبت وحده صلاحية المفتاح؛ أرسل رسالة من المساعد لاختبار طلب Gemini فعليًا.

## الملفات
- `public/index.html`: واجهة رعاية الكاملة مع إرسال رسائل الشات إلى `/api/chat`.
- `server.js`: خادم Express واتصال Gemini.
- `.env.example`: قالب إعدادات، وليس مكانًا لوضع مفتاح حقيقي ومشاركته.
- `.gitignore`: يمنع رفع `.env` و`node_modules`.
- `package.json`: الاعتماديات وأوامر التشغيل.

## ملاحظات مهمة
- استخدمنا `gemini-3.8-flash` كنموذج مستقر موضح في توثيق Google وقت إعداد الحزمة. يمكن تغييره عبر `GEMINI_MODEL` في `.env` إذا تغيّرت الإتاحة في حسابك.
- الخادم يرسل سياق آخر رسائل من الواجهة مع كل طلب، ولا يحفظ سجل المحادثة في قاعدة بيانات. يتم ضبط `store: false` لطلب Gemini؛ راجع سياسات Google الحالية قبل استخدام بيانات حقيقية.
- النموذج لا يصل تلقائيًا إلى دليل الأطباء أو قاعدة دوائية موثوقة. لا تستخدمه وحده لتشخيص أو قرارات علاجية.
- هذه نسخة مشروع أولية وليست نظامًا طبيًا جاهزًا للإنتاج. قبل النشر العام أضف حماية من إساءة الاستخدام ومعدل الطلبات ومراقبة الاستخدام، وسياسة خصوصية وموافقة مناسبة، ومصادقة وصلاحيات وقاعدة بيانات آمنة إذا احتجت بيانات مستخدمين.
- لا يمكن ضمان عمل أي API خارجي دون تجربة مفتاح صالح واتصال فعلي. إذا ظهرت مشكلة، افحص إعدادات `.env` وصلاحيات API وحصة الاستخدام.

## توثيق Google
- https://ai.google.dev/gemini-api/docs/interactions-overview
- https://ai.google.dev/gemini-api/docs/models
- https://aistudio.google.com/apikey


## PWA / phone installation
The app now includes a web app manifest, install icons, and a service worker for basic offline shell caching.
Serve it over HTTPS (or localhost for testing), then open it in the phone browser and choose "Add to Home Screen" / "Install app".
The AI chat still requires the Express backend and a server-side `GEMINI_API_KEY`; the service worker deliberately does not cache `/api/` responses.
Cloudflare Pages alone does not run this Express server as-is. Deploy the backend to a Node.js host, or migrate the API to Cloudflare Workers before deploying the entire app there.
