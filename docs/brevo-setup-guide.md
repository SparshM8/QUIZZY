# Email Verification Setup Guide — QUIZZY (Brevo)

QUIZZY ab **Brevo** (free tier: **300 emails/day**) use karta hai verification emails bhejne ke liye. Backend already deploy ho chuka hai — bas niche ke steps follow karo.

## Step 1 — Brevo pe free account banao (2 minute)

1. https://brevo.com pe jaao aur **Sign up free** karo (Google se bhi kar sakte ho).
2. Signup ke baad account active karne ke liye phone number verification mangega — ye normal hai, kar do.

## Step 2 — SMTP Key banao

1. Brevo dashboard mein left sidebar pe **SMTP & API** section pe jaao (ya directly: https://app.brevo.com/settings/keys/api).
2. **SMTP** tab select karo aur **Create a new SMTP Key** pe click karo.
3. Key ka naam kuch bhi de do (jaise `quizzy-production`) aur **Generate** pe click karo.
4. Key copy karo — ye format hoti hai: `xsmtpsib-XXXX...` — sirf ek baar dikhayi degi.

## Step 3 — Sender email add karo

1. Brevo dashboard mein **Senders & IP** (left sidebar) pe jaao.
2. **Add a sender** pe click karo.
3. Apni preferred email daalo, jaise `noreply@quizzy.example.com` ya apni koi bhi email (Gmail bhi kaam karegi).
4. Email pe aaya confirmation link click karke sender verify karo.

## Step 4 — Vercel pe environment variables add karo

1. https://vercel.com pe jaao aur apna project **QUIZZY** kholein.
2. **Settings → Environment Variables** pe click karo.
3. Teeno variables add karo (Production scope ke liye):

| Key | Value |
|---|---|
| `BREVO_SMTP_USER` | Step 3 ki sender email (jaise `noreply@quizzy.example.com`) |
| `BREVO_SMTP_PASSWORD` | Step 2 ki SMTP key (`xsmtpsib-...`) |
| `EMAIL_FROM_ADDRESS` | Step 3 ki sender email (same as above) |

4. **Save** pe click karo. Vercel automatically naya deployment karega.

## Step 5 — Kaam ho gaya

Agli koi bhi registration pe system automatically Brevo se verification email bhejega. Candidate email mein link pe click karke verify karta hai, uske baad wo test/quiz attempt kar sakta hai.

## Limits aur notes

Brevo free tier **300 emails/day** deta hai (Resend se 3x zyada). Verification ek-baar-ka kaam hai — ek candidate lifetime mein sirf ek baar verify hota hai; uske baad kabhi bhi koi bhi test lene mein koi email nahi chahiye. 300 naye students roz register nahi hote, isliye ye limit shuruaat ke liye kaafi hai. Jab genuinely zyada chahiye ho, Brevo ka paid plan ($25/month se) unlimited ke paas le jaata hai.
