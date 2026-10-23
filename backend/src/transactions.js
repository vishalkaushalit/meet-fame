// Provider order IDs are stable, so callbacks and retries update one ledger row.
export function recordTransaction(data, fields) {
  data.transactions ||= [];
  let transaction = data.transactions.find((item) => {
    return item.orderId === fields.orderId;
  });
  const now = new Date().toISOString();
  if (!transaction) {
    transaction = { id: `txn_${fields.orderId}`, createdAt: now };
    data.transactions.push(transaction);
  }
  Object.assign(transaction, fields, { updatedAt: now });
  return transaction;
}

// Retain payments made before the ledger was introduced. Never infer a payment
// from an ordinary booking, or label a cancelled session as refunded.
export function backfillTransactions(data) {
  let changed = false;
  for (const booking of data.bookings || []) {
    if (
      !booking.paymentOrderId ||
      !booking.paymentId ||
      booking.paymentStatus !== 'paid'
    ) {
      continue;
    }
    if (
      data.transactions?.some((item) => {
        return item.orderId === booking.paymentOrderId;
      })
    ) {
      continue;
    }
    recordTransaction(data, {
      orderId: booking.paymentOrderId,
      paymentId: booking.paymentId,
      bookingId: booking.id,
      userId: booking.userId,
      userName: booking.userName,
      influencerId: booking.influencerId,
      influencerName: booking.influencerName,
      date: booking.date,
      slot: booking.slot,
      amount: Math.round((booking.paymentAmount ?? booking.price) * 100),
      currency: booking.currency || 'USD',
      status: 'paid',
      createdAt: booking.createdAt,
    });
    changed = true;
  }
  // Store a USD reporting value without rewriting what Razorpay charged.
  for (const transaction of data.transactions || []) {
    if (Number.isSafeInteger(transaction.usdAmount)) {
      continue;
    }
    const booking = (data.bookings || []).find((item) => {
      return (
        item.paymentOrderId === transaction.orderId &&
        item.userId === transaction.userId
      );
    });
    const usdAmount =
      transaction.currency === 'USD'
        ? transaction.amount
        : booking && Number.isFinite(booking.price)
          ? Math.round(booking.price * 100)
          : null;
    if (!Number.isSafeInteger(usdAmount) || usdAmount < 0) {
      continue;
    }
    transaction.usdAmount = usdAmount;
    transaction.usdAmountSource =
      transaction.currency === 'USD' ? 'payment' : 'booking_price';
    changed = true;
  }
  return changed;
}
export function visibleTransactions(data, session) {
  if (!['user', 'admin'].includes(session.role)) {
    return null;
  }
  return (data.transactions || [])
    .filter((item) => {
      return session.role === 'admin' || item.userId === session.id;
    }).sort((a, b) => {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
}
