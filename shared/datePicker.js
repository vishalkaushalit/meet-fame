const initialized = new WeakSet();

export function initializeDatePickers(documentRoot = document) {
  if (initialized.has(documentRoot)) return;
  initialized.add(documentRoot);
  documentRoot.addEventListener('click', (event) => {
    const input = event.target;
    if (input?.tagName !== 'INPUT' || !['date', 'datetime-local'].includes(input.type)
      || input.disabled || input.readOnly || typeof input.showPicker !== 'function') return;
    try {
      input.showPicker();
    } catch {
      // Keep the native input usable when a browser restricts showPicker().
    }
  });
}
