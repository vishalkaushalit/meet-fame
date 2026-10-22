# Password recovery with email OTP

All login pages offer Forgot password. Recovery has three separate steps:
enter the account email, verify the OTP, then enter and confirm a new password.
Password inputs appear only after OTP verification succeeds. The verification
endpoint issues a single-use reset token valid for five minutes, held only in
page memory. The reset endpoint requires that token; submitting an OTP directly
cannot change a password. Reloading the page requires starting recovery again.

Backend/Vercel settings for normal email delivery:

```dotenv
RESEND_API_KEY=your-resend-api-key
PASSWORD_RESET_FROM=MeetFame <no-reply@your-verified-domain.com>
PASSWORD_RESET_TEST_OTP=
```

Use a verified Resend sender. Base URL variables are no longer needed. Restart
locally or redeploy after setting environment variables.

Production normally uses random six-digit codes. Local development uses `1111`
and works without email configuration. To enable the requested temporary test
mode in production, set `PASSWORD_RESET_TEST_OTP=1111` in Vercel and redeploy.
This allows anyone knowing an account email to reset its password. Remove the
setting and redeploy before using real accounts. The UI explicitly labels the
fixed code as a test OTP. Production never silently uses it on an email failure.

Codes expire after 10 minutes, work once, and lock after five incorrect guesses.
Resending after the 60-second cooldown replaces the previous code. Only HMAC
hashes bound to the account are stored in `passwordresets`. Ordinary production
responses never return codes. Old reset links no longer work. Successful resets
update the bcrypt password hash and invalidate existing sessions.

MongoDB version checks protect concurrent use and guess counting. Email sends
only after the reset record commits to MongoDB. Known and unknown accounts get
the same request confirmation. An additional per-instance IP limit allows 10
requests per 15 minutes; this limit is not shared across serverless instances.

Provider API: https://resend.com/docs/api-reference/emails/send-email
