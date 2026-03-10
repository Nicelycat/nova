/**
 * Strict Tab Blocker - Blocks ALL new tabs/popups unconditionally
 * Add to your site: <script src="tab-blocker-strict.js"></script>
 */

(function() {
    'use strict';

    // Store original methods
    const originalOpen = window.open;
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;

    // Block ALL window.open attempts
    window.open = function(url, target, features) {
        console.warn('[Tab Blocker] BLOCKED:', url || 'blank popup');
        showBlockedNotification(url || 'Unknown popup');
        return null;
    };

    // Block ALL link clicks that try to open new tabs
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Block any link with target="_blank"
        if (target === '_blank') {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Tab Blocker] BLOCKED link:', href);
            showBlockedNotification(href);
            return false;
        }

        // Block javascript: URLs
        if (href && href.startsWith('javascript:')) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Tab Blocker] BLOCKED javascript link');
            showBlockedNotification('javascript: link');
            return false;
        }

        // Block data: URLs
        if (href && href.startsWith('data:')) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Tab Blocker] BLOCKED data URI');
            showBlockedNotification('data URI');
            return false;
        }
    }, true);

    // Block form submissions that open new tabs
    document.addEventListener('submit', function(e) {
        const form = e.target;
        const target = form.getAttribute('target');
        
        if (target === '_blank') {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Tab Blocker] BLOCKED form submission');
            showBlockedNotification('Form popup');
            return false;
        }
    }, true);

    // Remove ALL meta refresh tags immediately
    function removeMetaRefresh() {
        document.querySelectorAll('meta[http-equiv="refresh"]').forEach(meta => {
            console.warn('[Tab Blocker] REMOVED meta refresh');
            meta.remove();
        });
    }

    // Run immediately and on DOM ready
    removeMetaRefresh();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeMetaRefresh);
    }

    // Block middle-click and ctrl+click on links
    document.addEventListener('mousedown', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        // Middle mouse button (button 2)
        if (e.button === 2 || e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Tab Blocker] BLOCKED middle-click');
            return false;
        }

        // Ctrl+click or Cmd+click
        if ((e.ctrlKey || e.metaKey) && link.getAttribute('href')) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Tab Blocker] BLOCKED ctrl+click');
            return false;
        }
    }, true);

    // Block context menu on links to prevent "Open in new tab"
    document.addEventListener('contextmenu', function(e) {
        const link = e.target.closest('a');
        if (link) {
            e.preventDefault();
            console.warn('[Tab Blocker] BLOCKED right-click menu');
            return false;
        }
    }, true);

    // Block window.location methods that open new windows
    Object.defineProperty(window.location, 'assign', {
        value: function(url) {
            if (url && (url.includes('blank') || url === 'about:blank')) {
                console.warn('[Tab Blocker] BLOCKED location.assign');
                showBlockedNotification('Location assign blocked');
                return;
            }
            return originalAssign.apply(this, arguments);
        },
        writable: false,
        configurable: false
    });

    Object.defineProperty(window.location, 'replace', {
        value: function(url) {
            if (url && (url.includes('blank') || url === 'about:blank')) {
                console.warn('[Tab Blocker] BLOCKED location.replace');
                showBlockedNotification('Location replace blocked');
                return;
            }
            return originalReplace.apply(this, arguments);
        },
        writable: false,
        configurable: false
    });

    // Block beforeunload hijacking
    window.addEventListener('beforeunload', function(e) {
        // Prevent the "Are you sure you want to leave" spam
        if (!window.__allowUnload) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Notification function
    function showBlockedNotification(source) {
        // Remove existing notifications
        const existing = document.getElementById('tab-blocker-notice');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.id = 'tab-blocker-notice';
        div.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff0000;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-family: sans-serif;
                font-size: 14px;
                z-index: 2147483647;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                max-width: 350px;
                border: 2px solid #cc0000;
                animation: tabBlockerSlide 0.2s ease;
            ">
                <strong>🚫 TAB BLOCKED</strong><br>
                <span style="font-size: 12px; opacity: 0.9; word-break: break-all;">
                    ${String(source).substring(0, 60)}${String(source).length > 60 ? '...' : ''}
                </span>
            </div>
        `;
        
        // Add animation styles
        if (!document.getElementById('tab-blocker-styles')) {
            const style = document.createElement('style');
            style.id = 'tab-blocker-styles';
            style.textContent = `
                @keyframes tabBlockerSlide {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);
        
        // Auto-remove after 2 seconds
        setTimeout(() => {
            if (div.parentNode) div.remove();
        }, 2000);
    }

    // Kill any existing popups that might have opened before this script loaded
    if (window.opener && window.opener !== window) {
        console.warn('[Tab Blocker] Closing popup that opened before protection');
        window.close();
    }

    console.log('[Tab Blocker] STRICT MODE - All popups blocked');
})();
