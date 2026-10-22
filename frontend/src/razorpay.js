let checkoutScript;
export function openRazorpay(options) {
  if (!checkoutScript) checkoutScript = new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => { checkoutScript = null; reject(new Error('Unable to load payment checkout. Please try again.')); };
    document.head.appendChild(script);
  });
  return checkoutScript.then(() => new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      ...options,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error('Payment cancelled. Your slot has not been booked.')) },
    });
    checkout.open();
  }));
}
