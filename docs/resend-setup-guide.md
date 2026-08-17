# Email Verification Setup Guide — QUIZZY

QUIZZY ke backend mein email verification system already deploy ho chuka hai (production URL: https://quizzy-git-main-sparsh-mishras-projects-870ea013.vercel.app). Ab bas ek chhota sa step baaki hai: email bhejne ke liye **Resend** ka free API key add karna.

## Step 1 — Resend pe free account banao (2 minute)

1. https://resend.com pe jaao aur **Sign up** karo (Google se bhi kar sakte ho).
2. Free plan mein **100 emails/day** milte hain — shuruaat ke liye kaafi hai.

## Step 2 — API Key banao

1. Resend dashboard mein left sidebar pe **API Keys** pe click karo.
2. **Create API Key** pe click karo.
3. Name kuch bhi de do (jaise `quizzy-production`) aur domain pehle se verified hota hai free tier pe (resend.dev test domain).
4. Key copy karo — ye sirf ek baar dikhayi degi (format: `re_XXXX...`).

## Step 3 — Vercel pe environment variables add karo

1. https://vercel.com pe jaao aur apna project **QUIZZY** kholein.
2. **Settings → Environment Variables** pe click karo.
3. Do naye variables add karo (Production scope ke liye):

| Key | Value |
|---|---|
| `RESEND_API_KEY` | `re_...` (Step 2 ki key) |
| `EMAIL_FROM_ADDRESS` | `onboarding@resend.dev` (free test domain) |

4. **Save** pe click karo.

> Jab baad mein apna real domain use karna ho (jaise `quizzy.example.com`), Resend mein domain verify karo aur `EMAIL_FROM_ADDRESS` ko `noreply@quizzy.example.com` jaisa kar do.

## Step 4 — Kaam ho gaya

Agli koi bhi registration pe system automatically verification email bhejega. Email mein ek link hota hai jise candidate click karke apna email verify karta hai. Bina verify kiye candidate test/quiz attempt nahi kar sakta — ye exactly aapki maang thi ki random email registration band ho.

## Notes

- Resend ke bina bhi sab kuch chalta hai: register/login/profile kaam karte hain; bas verification email nahi bheji jaati.
- Verification link ki expiry 24 ghante hai; resend endpoint se naya link mangaya ja sakta hai.
- Har naye user ko ek unique **Candidate ID** (jaise `QUIZ-A7K2-M9P4`) automatically milta hai — teacher aur recruiter ise dekh sakte hain user ki activity track karne ke liye.
- Environment variables badalne ke baad Vercel automatically naya deployment karega — koi aur action nahi chahiye.
