# Email Verification Setup Guide — QUIZZY (Brevo REST API)

QUIZZY ab **Brevo** (free tier: **300 emails/day**) use karta hai verification emails bhejne ke liye. Backend Brevo ki **REST API** (`api.brevo.com/v3/smtp/email`) se email bhejta hai — SMTP ki zaroorat nahi hai. Ye guide production mein verify kiya gaya hai (18 Aug 2026).

> **Important:** Brevo ki SMTP relay Vercel ke serverless environment se block thi (IP whitelist). Isliye code SMTP nahi, REST API use karta hai — iske liye niche Step 5 (IP blocking off) zaroori hai.

## Step 1 — Brevo pe free account banao (2 minute)

1. https://brevo.com pe jaao aur **Sign up free** karo (Google se bhi kar sakte ho).
2. Signup ke baad account active karne ke liye phone number verification mangega — ye normal hai, kar do.

## Step 2 — API Key banao (SMTP key nahi)

1. Brevo dashboard mein left sidebar pe **SMTP & API** section pe jaao (ya directly: https://app.brevo.com/settings/keys/api).
2. **API Keys** tab select karo aur **Create a new API Key** pe click karo.
3. Key ka naam kuch bhi de do (jaise `quizzy-production-api`) aur **Generate** pe click karo.
4. Key copy karo — ye format hoti hai: `xkeysib-XXXX...` — sirf ek baar dikhayi degi.

## Step 3 — Sender email add karo

1. Brevo dashboard mein **Senders & IP** (left sidebar) pe jaao.
2. **Add a sender** pe click karo.
3. Apni preferred email daalo, jaise `noreply@quizzy.example.com` ya apni koi bhi email (Gmail bhi kaam karegi).
4. Email pe aaya confirmation link click karke sender verify karo.

## Step 4 — Vercel pe environment variables add karo

1. https://vercel.com pe jaao aur apna project **QUIZZY** kholein.
2. **Settings → Environment Variables** pe click karo.
3. Ye variable add karo (Production + Preview scope):

| Key | Value |
|---|---|
| `BREVO_API_KEY` | Step 2 ki API key (`xkeysib-...`) |
| `EMAIL_FROM_ADDRESS` | Step 3 ki verified sender email |

4. **Save** pe click karo. Vercel automatically naya deployment karega.

> Purane `BREVO_SMTP_USER` / `BREVO_SMTP_PASSWORD` variables ab use nahi hote — delete kar do.

## Step 5 — API key ke liye IP blocking band karo (zaroori!)

Vercel serverless functions ke IPs pehle se pata nahi hote, isliye API key ko kisi IP list se restrict nahi karna:

1. Brevo dashboard mein **Settings → API Keys** ya **Security** section mein **Authorised IPs** / IP filtering setting dhundho.
2. API keys ke liye IP blocking ko **deactivate** kar do (SMTP key ke liye activate reh sakta hai — wo use nahi ho rahi).
3. Agar prompt aaye, changes confirm karo.

## Step 6 — Kaam ho gaya

Agli koi bhi registration pe system automatically Brevo se verification email bhejega. Candidate email mein link pe click karke verify karta hai (link 24 ghante valid rehta hai), uske baad wo test/quiz attempt kar sakta hai. Har naye candidate ko ek unique **Candidate ID** (format: `QUIZ-XXXX-XXXX`) milta hai jo registration response mein aata hai.

## Limits aur notes

Brevo free tier **300 emails/day** deta hai (Resend se 3x zyada). Verification ek-baar-ka kaam hai — ek candidate lifetime mein sirf ek baar verify hota hai; uske baad kabhi bhi koi bhi test lene mein koi email nahi chahiye. 300 naye students roz register nahi hote, isliye ye limit shuruaat ke liye kaafi hai. Jab genuinely zyada chahiye ho, Brevo ka paid plan ($25/month se) unlimited ke paas le jaata hai.

## Troubleshooting

| Problem | Fix |
|---|---|
| Registration successful but email nahi mila | Vercel → Logs → Runtime mein "Sending verification email via Brevo REST API" line dhundho; `keyConfigured:false` matlab `BREVO_API_KEY` missing — Step 4 repeat karo |
| Brevo logs mein "Hard bounce" | Recipient email galat/nonexistent hai — real valid email pe test karo |
| "Brevo API request timed out" error | Rare; code 30s timeout use karta hai. Fir se resend endpoint use karo (`POST /api/auth/resend-verification`) |
| "unauthorized" error | API key galat hai ya IP blocking abhi bhi on hai (Step 5) |

## Email flow summary

1. Student register karta hai → system **Candidate ID** generate karta hai, `isEmailVerified: false` set karta hai, 24h single-use hashed token banata hai, aur Brevo se verify email bhejta hai.
2. Student email mein link pe click karta hai → `POST /api/auth/verify-email` token validate karta hai → `isEmailVerified: true`.
3. Verified hone tak student start/save/submit attempt endpoints use nahi kar sakta (`EMAIL_NOT_VERIFIED` 403 error aayega).
4. Email na aaye to `POST /api/auth/resend-verification` se naya link request kar sakta hai (response generic rehta hai taaki email enumeration attack na ho sake).
