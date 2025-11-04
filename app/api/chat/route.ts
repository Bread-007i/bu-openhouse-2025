import { NextRequest } from "next/server";
export const runtime = "edge";

type Msg = { role: "user" | "assistant"; content: string };

// Minimal, safe user data shape — consumers may populate this at runtime
const userData = {
  name: "",
  fullName: "",
  role: "",
  skills: [] as string[],
  education: [] as { school?: string; period?: string; description?: string }[],
  location: "",
  interests: [] as string[],
  projects: [] as string[],
  contact: {
    email: "",
    phone: "",
    website: "",
    github: "",
    linkedin: "",
  },
};

// System prompt (robust to empty fields)
const systemPrompt = `You are a professional AI assistant representing a user's portfolio.\n\nABOUT ME:\n- Name: ${userData.fullName || '-'}\n- Nickname: ${userData.name || '-'}\n- Role: ${userData.role || '-'}\n- Location: ${userData.location || '-'}\n\nTECHNICAL SKILLS:\n${(userData.skills.length ? userData.skills : ['-']).map(s => `- ${s}`).join('\n')}\n\nEDUCATION:\n${(userData.education.length ? userData.education : [{ school: '-', period: '-', description: '-' }]).map(e => `- ${e.school || '-'} (${e.period || '-'})\n  ${e.description || '-'}`).join('\n')}\n\nPROJECTS:\n${(userData.projects.length ? userData.projects : ['-']).map(p => `- ${p}`).join('\n')}\n\nINTERESTS:\n${(userData.interests.length ? userData.interests : ['-']).map(i => `- ${i}`).join('\n')}\n\nCONTACT:\n- Email: ${userData.contact.email || '-'}\n- Phone: ${userData.contact.phone || '-'}\n- Website: ${userData.contact.website || '-'}\n- GitHub: ${userData.contact.github || '-'}\n- LinkedIn: ${userData.contact.linkedin || '-'}\n\nINSTRUCTIONS:\n1. Answer in Thai unless explicitly asked to use English.\n2. Be concise, friendly and professional.\n3. Use the data above when appropriate.\n4. If unsure, suggest contacting the user directly.\n`;

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Msg[] } = await req.json();
  const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ content: "⚠️ ไม่มี API Key (GEMINI_API_KEY) - ตั้งค่าใน environment variable" }), {
        status: 401,
      });
    }

    const userMsg = [...(messages || [])].reverse().find((m) => m.role === "user")?.content ?? "";

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nUSER MESSAGE: ${userMsg}\n\nPlease respond as AI assistant using the information provided above.`,
              },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    const data = await resp.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? "⚠️ ไม่มีคำตอบจาก Gemini";

    return new Response(JSON.stringify({ content }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
    });
  }
}
