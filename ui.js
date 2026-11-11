// Funções puras de escape e validação de URLs para impedir XSS ao montar HTML.
(function (root) {
    'use strict';
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }
    function safeImageURL(value) {
        if (typeof value !== 'string' || !value.trim()) return 'img/placeholder.svg';
        const src = value.trim();
        if (/^img\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|svg)$/i.test(src)) return src;
        try {
            const u = new URL(src);
            if ((u.protocol === 'https:' || u.protocol === 'http:') && !u.username && !u.password) return u.href;
        } catch (_) { /* URL relativa inesperada */ }
        return 'img/placeholder.svg';
    }
    const api = Object.freeze({ escapeHTML, safeImageURL });
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RessonanceUI = api;
})(typeof window === 'undefined' ? null : window);
