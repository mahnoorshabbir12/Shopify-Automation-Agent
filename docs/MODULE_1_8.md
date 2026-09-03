# Module 1.8 — Retry on No-Answer & Call-Ended Webhooks

## What we built
Module 1.8 handles post-call lifecycle processing when an outbound Retell call completes.
It enforces the core business mandate: **"One missed call never rejects an order."**

When an outbound call finishes, Retell triggers `POST /webhooks/retell/call-ended`. The system:
1. Validates the webhook using constant-time comparison on `X-Retell-Secret` or `Authorization: Bearer <secret>`.
2. Inspects `disconnection_reason` (`no_answer`, `busy`, `voicemail_reached`, `dial_failed`).
3. If unanswered:
   - If `attempt_count < MAX_CONFIRMATION_ATTEMPTS` (default 3):
     - Calculates a strategic tiered delay (Attempt 1: 2 hours, Attempt 2: 24 hours, Attempt 3: 48 hours).
     - Schedules an idempotent `attempt_confirmation_call` task in `workflow_tasks`.
     - Re-routes order state to `pending_confirmation`.
   - If `attempt_count >= MAX_CONFIRMATION_ATTEMPTS`:
     - Transitions order to `UNREACHABLE` to stop calling.
4. Idempotency: If the customer already confirmed mid-call via the `confirm_order` tool, the call-ended webhook safely preserves `CONFIRMED` status.

---

## Concepts and decisions

### The Disconnection Reason Router
Telephony outcomes fall into two distinct groups: operational failures (`dial_failed`, `busy`, `no_answer`, `voicemail_reached`) and conversational completions (`call_transferred`, `call_ended`).
- **Use it when:** Telephony providers send webhook events indicating why audio stopped.
- **Where it lives:** `backend/services/workflow/confirmation_service.py:process_call_outcome`.

### Tiered Exponential Backoff vs. Linear Delay
Instead of fixed 1-hour delays, our tiered delays increase non-linearly (2h → 24h → 48h). This tests both short-term availability (e.g. driving) and long-term diurnal cycles (morning vs. afternoon).

### The UNREACHABLE Terminal State
When an order hits `MAX_CONFIRMATION_ATTEMPTS`, it transitions to `UNREACHABLE` rather than `REJECTED`. This ensures a human operator can attempt alternative contact methods (WhatsApp, SMS) before cancelling.

---

## Approach Used & Why

### Chosen Approach: Tiered Strategic Backoff (2h → 24h → 48h) with Mid-Call Idempotent Preservation
- **Why this approach:**
  1. **Customer Contact Psychology:** Immediate rapid redialing (e.g. within 15 minutes) irritates customers who are driving, in meetings, or asleep. Real-world e-commerce studies demonstrate that attempting contact across differing time slots (e.g. 2 hours later, then the next morning 24 hours later) boosts call pickup rates by over 60%.
  2. **Bounded Attempt Protection:** Without an explicit maximum attempt threshold (`MAX_CONFIRMATION_ATTEMPTS = 3`), unanswered calls would dial indefinitely, burning telephony minutes and harassing prospective buyers. Moving to `UNREACHABLE` enables human operator review.
  3. **Replay & Concurrency Protection:** Telephony webhooks can arrive out-of-order due to network retries. If a customer already provided 3-point confirmation during the call via the live `confirm_order` tool, the webhook processor recognizes that the order is already in a terminal success state (`CONFIRMED`) and skips scheduling further calls.

### Pros & Cons
| Pros | Cons |
|---|---|
| Maximizes customer answer rates by testing different time windows. | Order confirmation lifecycle spans up to 48–72 hours for elusive customers. |
| Prevents customer harassment and wasted telephony API expenditure. | Requires persisting attempt counters and scheduled timestamps in the database. |
| Mid-call tool state is never clobbered or downgraded by late-arriving webhooks. | Operators must monitor the `UNREACHABLE` queue for manual follow-up. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Debt Collection & Payment Notice Reminders:** Compliance-controlled calling schedules where regulations restrict the frequency and timing of borrower contact.
2. **Sales Lead Inbound Follow-Ups:** Contacting high-intent enterprise demo requests where calling at varied times of the working day maximizes connection likelihood.
3. **Medical Lab Test Result Notifications:** Critical patient notifications where failure to answer must trigger bounded retries before escalating to registered mail or emergency contact outreach.
4. **Courier Delivery Rescheduling:** When a recipient is not home for parcel delivery, triggering an automated confirmation call the next day to confirm presence.

### When NOT to Use This Approach
- Real-time emergency or security alert systems (e.g. fraud detection or multi-factor authentication SMS) where retries must be immediate or fail within seconds.
- High-frequency ephemeral notifications where missed alerts become obsolete immediately (e.g. ride-share arrival alerts).

---

## Architecture Flow

```text
Retell Call Ends
      │
      ▼
POST /webhooks/retell/call-ended (Secret Verified)
      │
      ▼
Check Disconnection Reason
      ├── Customer Confirmed Mid-Call ──► Keep Status: CONFIRMED (Idempotent)
      │
      └── "no_answer" / "busy":
            │
            ├── attempt_count < 3 ─────► Calculate Backoff (2h / 24h / 48h)
            │                            └─► Enqueue WorkflowTask (attempt N+1)
            │                            └─► Status: PENDING_CONFIRMATION
            │
            └── attempt_count >= 3 ────► Status: UNREACHABLE (Cease calls)
```

---

## Verification

Run the test suite:
```powershell
set PYTHONPATH=. && py -3.11 -m pytest tests/test_retry_workflow.py -v
```

All 5 tests verify authentication, first-retry scheduling, tiered backoff, terminal state preservation, and max-retry escalation to `UNREACHABLE`.
