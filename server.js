import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

app.disable("x-powered-by");
app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SYSTEM_INSTRUCTION = `
أنت المساعد الصحي في تطبيق «رعاية». تحدث بالعربية المصرية الواضحة والمحترمة.
أنت أداة معلومات وتوجيه أولي، ولست طبيبًا ولا تشخّص الأمراض.
- ساعد المستخدم على فهم المعلومات الصحية العامة وتحديد التخصص الطبي الذي قد يناسبه.
- اسأل أسئلة توضيحية قصيرة عند الحاجة، ولا تجزم بسبب الأعراض.
- لا تصف أدوية ولا تغيّر الجرعات، ولا تؤكد أن دواءين آمنان معًا دون قاعدة دوائية موثوقة.
- لا تخترع أسماء أطباء أو عناوين أو أسعارًا أو مواعيد؛ قل إنك لا تملك بيانات مؤكدة إذا سُئلت عن مزود محدد.
- إذا ذكر المستخدم علامات طارئة مثل صعوبة التنفس الشديدة، ألم الصدر الشديد، فقدان الوعي، أعراض السكتة، أو نزيفًا شديدًا، وجّهه فورًا إلى خدمات الطوارئ المحلية ولا تؤخر ذلك بأسئلة.
- لا تطلب الاسم أو رقم الهاتف أو رقم الهوية أو معلومات تعريفية غير لازمة.
- اختم النصائح الطبية المهمة بالتنبيه أن الرد لا يغني عن مختص صحي.
- لا تدّع أنك حللت صورة أو راجعت ملفًا أو قاعدة بيانات ما لم تكن هذه الإمكانية متصلة فعليًا.
`;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    apiKeyConfigured: Boolean(API_KEY),
    model: MODEL
  });
});

app.post("/api/chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "مفتاح Gemini غير مضبوط. انسخ .env.example إلى .env وأضف GEMINI_API_KEY."
    });
  }

  const message = req.body?.message;
  const history = req.body?.history;

  if (typeof message !== "string" || !message.trim() || message.length > 4000) {
    return res.status(400).json({ error: "اكتب رسالة صحيحة لا تتجاوز 4000 حرف." });
  }

  const safeHistory = Array.isArray(history)
    ? history.slice(-10).filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.text === "string"
      )
    : [];

  const transcript = safeHistory
    .map(item => `${item.role === "user" ? "المستخدم" : "المساعد"}: ${item.text.slice(0, 4000)}`)
    .join("\n");

  const input = transcript
    ? `سياق المحادثة السابقة:\n${transcript}\n\nرسالة المستخدم الحالية:\n${message.trim()}`
    : message.trim();

  try {
    const interaction = await ai.interactions.create({
      model: MODEL,
      system_instruction: SYSTEM_INSTRUCTION,
      input,
      // Medical conversations should not be retained by the API for this prototype.
      store: false
    });

    const reply = typeof interaction.output_text === "string"
      ? interaction.output_text.trim()
      : "";

    if (!reply) {
      return res.status(502).json({ error: "لم يرجع Gemini نصًا. حاول مرة أخرى." });
    }

    return res.json({ reply });
  } catch (error) {
    // Keep secrets and request contents out of logs.
    console.error("Gemini API error:", error?.status || error?.name || "unknown");
    const status = Number(error?.status);
    if (status === 401 || status === 403) {
      return res.status(502).json({
        error: "Gemini رفض المفتاح أو الصلاحية. راجع API Key وإعدادات مشروعك."
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error: "وصلت لحد الطلبات المسموح به حاليًا. انتظر قليلًا ثم حاول."
      });
    }
    return res.status(502).json({
      error: "حصل خطأ أثناء الاتصال بـ Gemini. راجع اتصال الإنترنت وإعدادات المفتاح ثم حاول."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Reaya is running at http://localhost:${PORT}`);
  console.log(`Gemini model: ${MODEL}`);
  if (!API_KEY) console.warn("GEMINI_API_KEY is missing. Add it to .env before using the AI assistant.");
});
