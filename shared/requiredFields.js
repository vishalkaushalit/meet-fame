export function initializeRequiredFields(documentRoot = document) {
  const update = () => {
    const requiredLabels = new Set();
    for (const field of documentRoot.querySelectorAll(
      'input[required], select[required], textarea[required], [aria-required="true"]',
    )) {
      for (const label of field.labels || []) {
        requiredLabels.add(label);
      }
    }
    for (const label of documentRoot.querySelectorAll('label')) {
      const star = label.querySelector('.required-field-star');
      if (!requiredLabels.has(label)) {
        star?.remove();
        continue;
      }
      if (star) {
        continue;
      }
      const walker = documentRoot.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode())) {
        if (
          !text.textContent.trim() ||
          text.parentElement.closest('select, button, .required-field-star')
        ) {
          continue;
        }
        const marker = documentRoot.createElement('span');
        marker.className = 'required-field-star';
        marker.textContent = ' *';
        marker.setAttribute('aria-hidden', 'true');
        text.after(marker);
        break;
      }
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(documentRoot.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['required', 'aria-required', 'for', 'id'],
  });
  update();
  return () => {
    return observer.disconnect();
  };
}
