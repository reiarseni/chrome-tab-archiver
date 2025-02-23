// i18n.js - Replaces __MSG_*__ tokens with localized messages
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('*').forEach(function(node) {
    if (node.childNodes && node.childNodes.length) {
      node.childNodes.forEach(function(child) {
        if (child.nodeType === Node.TEXT_NODE && child.nodeValue.includes('__MSG_')) {
          child.nodeValue = child.nodeValue.replace(/__MSG_([^_]+(?:_[^_]+)*)__/, function(match, p1) {
            return chrome.i18n.getMessage(p1) || match;
          });
        }
      });
    }
    if (node.hasAttribute && node.hasAttribute('placeholder')) {
      let placeholder = node.getAttribute('placeholder');
      if (placeholder.includes('__MSG_')) {
        node.setAttribute('placeholder', chrome.i18n.getMessage(placeholder.replace(/__MSG_(.+)__/, '$1')));
      }
    }
  });
});

