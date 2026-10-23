# Bank details

Influencers can add or replace their own bank details from My Profile. Administrators can do the same from Edit profile. Bank details save independently of profile edits.

Configure `BANK_DETAILS_ENCRYPTION_KEY` on the backend with a random secret of at least 32 characters. If absent, an explicitly configured `JWT_SECRET` of at least 32 characters is used. The development JWT fallback is never used. Keep the chosen secret stable and backed up: changing it requires migration of existing encrypted records before those records can be used for payouts.

Authenticated GET and PUT `/api/auth/bank-details` are restricted to administrators and approved influencers. The owner comes from the session, never the request body. Owner-only reads decrypt saved values to prefill the edit form and use Cache-Control: no-store. Account number and confirmation inputs are visually concealed. Save responses return masked account numbers. Replacements require all fields and matching account confirmation; Indian accounts require an IFSC. Other countries accept a routing code or SWIFT/BIC. Format validation does not verify bank ownership or payout eligibility.

The separate `bankdetails` collection stores AES-256-GCM ciphertext for the full bank payload, with a random IV and authentication tag. Summary metadata contains the account holder, bank name, country, and masked account number. General profile and influencer APIs do not include these records.

This feature does not verify accounts, onboard Razorpay linked accounts, or initiate payouts. Those require a separate provider integration.
