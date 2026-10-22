# Razorpay booking checkout

Set these variables on the **backend** (local backend `.env` and Vercel project environment):

```dotenv
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
```

Never put the secret in `frontend/.env` or a `VITE_` variable. No frontend payment environment variable is needed: the authenticated order endpoint returns the public checkout key.

Enable automatic payment capture in Razorpay. The booking endpoint rejects payments until Razorpay reports `captured`. International/USD payments must be enabled on the merchant account to accept USD checkout.

All new checkout orders charge USD at the stored session rate, regardless of location. No exchange-rate lookup is required. Existing INR transaction history is retained, and previously issued INR orders can still be verified.

The server creates orders from the influencer's stored rate, binds orders to the signed-in user and exact date/slot, verifies the HMAC signature and queries Razorpay for captured payment status. Direct unpaid booking requests are rejected. The payment ID and order ID are saved with the booking. Repeated verification of a completed booking is idempotent.

If another user books the slot during checkout, verification requests a full refund instead of confirming a duplicate booking. There is no temporary slot reservation during checkout. Standard booking cancellation does not automatically refund a payment; process cancellation refunds in the Razorpay dashboard.

The browser stores successful checkout proof in session storage until booking verification completes and offers **Retry payment verification** after a connection failure. No webhook reconciliation is implemented. If the browser closes before the success callback, or verification/persistence fails permanently, reconcile captured payments in the Razorpay dashboard using the order notes. A paid order whose scheduled session has already started requires support reconciliation.

## Test before accepting live payments

1. Configure test keys and automatic capture, restart the backend.
2. Sign in as a user, choose a future slot and click **Pay & Book Slot**.
3. Complete a Razorpay test payment; confirm exactly one booking appears.
4. Cancel checkout and confirm no booking is created.
5. Test USD checkout with your merchant account's supported payment methods.
6. Retry verification after a simulated network failure; confirm no second payment or booking.

Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

## Billing ledger

Payment orders are stored in the MongoDB `transactions` collection (or the local JSON `transactions` array during local-file development). The ledger records amounts in smallest currency units, currency, customer, influencer, session, provider references and the linked booking. Booking confirmation and its paid transaction are committed together by the existing database transaction middleware.

Open **Billing** in the user portal for the signed-in customer's history, or **Billing** in the admin sidebar for all customers. The authenticated `/api/bookings/transactions` endpoint derives access from the session, never a supplied user ID. Previously verified booking payments are backfilled into persistent transaction records when billing is first loaded. Older bookings without verified payment references are not presented as payments.

`pending` means an order was created but the app has not confirmed payment; it may include abandoned checkout. `refund_pending` means the provider accepted a refund request but has not yet reported it processed. These states do not automatically reconcile with later provider events; webhooks remain a separate integration. Paid totals are grouped by currency and exclude pending and refunded records. Cancelling a booking alone does not change its financial status.
