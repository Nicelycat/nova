<!-- ULTIMATE TAB & REDIRECT BLOCKER - Place this FIRST in <head> -->
<script>
(function() {
    'use strict';

    // Store original methods
    const originalOpen = window.open;
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    let lastRedirectAttempt = 0;

    // Block ALL window.open attempts
    window.open = function(url, target, features) {
        console.warn('[Blocker] BLOCKED popup:', url || 'blank');
        showNotification('🚫 Popup Blocked', url || 'unknown');
        return null;
    };

    // Block location changes that happen too fast (redirect spam)
    function blockSuspiciousNavigation() {
        const now = Date.now();
        if (now - lastRedirectAttempt < 1000) {
            console.warn('[Blocker] BLOCKED rapid redirect');
            return true;
        }
        lastRedirectAttempt = now;
        return false;
    }

    // Override location methods
    Object.defineProperty(window.location, 'assign', {
        value: function(url) {
            if (blockSuspiciousNavigation() || isSuspiciousUrl(url)) {
                showNotification('🚫 Redirect Blocked', url);
                return;
            }
            console.log('[Blocker] Allowing assign to:', url);
            return originalAssign.call(window.location, url);
        },
        writable: false,
        configurable: false
    });

    Object.defineProperty(window.location, 'replace', {
        value: function(url) {
            if (blockSuspiciousNavigation() || isSuspiciousUrl(url)) {
                showNotification('🚫 Redirect Blocked', url);
                return;
            }
            return originalReplace.call(window.location, url);
        },
        writable: false,
        configurable: false
    });

    // Block href changes
    let originalHref = window.location.href;
    Object.defineProperty(window.location, 'href', {
        get: function() { return originalHref; },
        set: function(url) {
            if (blockSuspiciousNavigation() || isSuspiciousUrl(url)) {
                showNotification('🚫 Navigation Blocked', url);
                return;
            }
            originalHref = url;
            window.location.assign(url);
        },
        configurable: false
    });

    // Check if URL is suspicious (ad/redirect domains)
    function isSuspiciousUrl(url) {
        if (!url) return false;
        const suspicious = [
            'doubleclick.net', 'googlesyndication', 'googleadservices',
            'facebook.com/tr', 'adsystem', 'amazon-adsystem',
            'adnxs.com', 'adsrvr.org', 'advertising.com',
            'outbrain.com', 'taboola.com', 'popads.net',
            'onclickads.net', 'adsterra.com', 'propellerads',
            'bit.ly', 'tinyurl', 'short.link', 't.co',
            'goto', 'redirect', 'click', 'offer', 'survey',
            'win', 'prize', 'lucky', 'winner', 'free',
            'crypto', 'wallet', 'verify', 'login', 'signin',
            'download', 'install', 'update', 'alert',
            'tech-support', 'virus-detected', 'security',
            'customer-service', 'support', 'help-desk',
            'billing', 'payment', 'refund', 'suspended',
            'unusual-activity', 'account-locked', 'verify-now'
        ];
        const lowerUrl = url.toLowerCase();
        return suspicious.some(s => lowerUrl.includes(s));
    }

    // Block ALL link clicks that try to open new tabs or redirect
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Block target="_blank"
        if (target === '_blank') {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Blocker] BLOCKED _blank link:', href);
            showNotification('🚫 New Tab Blocked', href);
            return false;
        }

        // Block suspicious hrefs
        if (href && (href.startsWith('javascript:') || href.startsWith('data:') || isSuspiciousUrl(href))) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Blocker] BLOCKED suspicious link:', href);
            showNotification('🚫 Malicious Link Blocked', href);
            return false;
        }

        // Block if clicking on iframe or within iframe
        if (e.target.tagName === 'IFRAME' || window.self !== window.top) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Blocker] BLOCKED iframe click');
            return false;
        }
    }, true);

    // Block beforeunload hijacking
    window.addEventListener('beforeunload', function(e) {
        if (!window.__allowUnload) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Monitor for iframe navigation attempts
    window.addEventListener('message', function(e) {
        // Block messages that might trigger redirects
        if (typeof e.data === 'string' && isSuspiciousUrl(e.data)) {
            console.warn('[Blocker] BLOCKED suspicious postMessage:', e.data);
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    // Block popstate manipulation
    window.addEventListener('popstate', function(e) {
        if (blockSuspiciousNavigation()) {
            history.pushState(null, '', window.location.href);
            console.warn('[Blocker] BLOCKED back-button hijack');
        }
    });

    // Remove meta refresh tags
    function removeMetaRefresh() {
        document.querySelectorAll('meta[http-equiv="refresh"]').forEach(meta => {
            console.warn('[Blocker] REMOVED meta refresh');
            meta.remove();
        });
    }
    removeMetaRefresh();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeMetaRefresh);
    }

    // Block right-click on iframes
    document.addEventListener('contextmenu', function(e) {
        if (e.target.tagName === 'IFRAME') {
            e.preventDefault();
            return false;
        }
    }, true);

    // Notification function
    function showNotification(title, source) {
        const existing = document.getElementById('blocker-notice');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.id = 'blocker-notice';
        div.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc2626;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-family: sans-serif;
                font-size: 14px;
                z-index: 2147483647;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                max-width: 350px;
                border: 2px solid #b91c1c;
                animation: blockerSlide 0.2s ease;
            ">
                <strong>${title}</strong><br>
                <span style="font-size: 12px; opacity: 0.9; word-break: break-all;">
                    ${String(source).substring(0, 60)}${String(source).length > 60 ? '...' : ''}
                </span>
            </div>
        `;
        
        if (!document.getElementById('blocker-styles')) {
            const style = document.createElement('style');
            style.id = 'blocker-styles';
            style.textContent = `
                @keyframes blockerSlide {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    // If this is a popup that opened before protection, close it
    if (window.opener && window.opener !== window && window.history.length <= 1) {
        console.warn('[Blocker] Closing pre-existing popup');
        window.close();
    }

    console.log('[Blocker] ULTIMATE MODE ACTIVE - All redirects & popups blocked');
})();
</script>
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
