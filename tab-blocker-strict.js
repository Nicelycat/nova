<!-- NUCLEAR NAVIGATION BLOCKER - Blocks EVERYTHING -->
<script>
(function() {
    'use strict';

    // Store originals
    const originalOpen = window.open;
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    let currentUrl = window.location.href;

    // BLOCK ALL window.open
    window.open = function() {
        console.warn('[BLOCKER] window.open blocked');
        showBlockNotice('New Tab Blocked');
        return null;
    };

    // BLOCK location.assign
    window.location.assign = function() {
        console.warn('[BLOCKER] location.assign blocked');
        showBlockNotice('Navigation Blocked');
        return;
    };

    // BLOCK location.replace
    window.location.replace = function() {
        console.warn('[BLOCKER] location.replace blocked');
        showBlockNotice('Redirect Blocked');
        return;
    };

    // BLOCK location.href setter
    Object.defineProperty(window.location, 'href', {
        get: function() { return currentUrl; },
        set: function(val) {
            console.warn('[BLOCKER] location.href blocked:', val);
            showBlockNotice('Navigation Blocked');
            return currentUrl;
        },
        configurable: false
    });

    // BLOCK ALL clicks
    document.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target.closest('a');
        if (target) {
            console.warn('[BLOCKER] Link click blocked:', target.href);
            showBlockNotice('Link Click Blocked');
        }
        return false;
    }, true);

    // BLOCK form submissions
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('[BLOCKER] Form submission blocked');
        showBlockNotice('Form Blocked');
        return false;
    }, true);

    // BLOCK mousedown (catches middle-click, ctrl+click)
    document.addEventListener('mousedown', function(e) {
        if (e.button !== 0) { // Not left click
            e.preventDefault();
            e.stopPropagation();
            console.warn('[BLOCKER] Non-left click blocked');
            return false;
        }
    }, true);

    // BLOCK context menu everywhere
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        console.warn('[BLOCKER] Right-click blocked');
        return false;
    }, true);

    // BLOCK keyboard shortcuts that open new tabs
    document.addEventListener('keydown', function(e) {
        // Ctrl+T, Ctrl+N, Ctrl+Click equivalents
        if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'n')) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[BLOCKER] Keyboard shortcut blocked');
            return false;
        }
    }, true);

    // BLOCK beforeunload manipulation
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '';
    });

    // BLOCK popstate (back/forward button hijacks)
    window.addEventListener('popstate', function(e) {
        history.pushState(null, '', currentUrl);
        console.warn('[BLOCKER] History manipulation blocked');
    });

    // BLOCK postMessage
    window.addEventListener('message', function(e) {
        e.stopPropagation();
        e.preventDefault();
        console.warn('[BLOCKER] postMessage blocked');
    }, true);

    // Remove meta refresh immediately
    document.querySelectorAll('meta[http-equiv="refresh"]').forEach(m => m.remove());

    // Notification
    function showBlockNotice(type) {
        const id = 'nuke-blocker-notice';
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.id = id;
        div.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #7f1d1d;
                color: #fecaca;
                padding: 12px 20px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                z-index: 2147483647;
                border: 2px solid #dc2626;
                box-shadow: 0 4px 20px rgba(220,38,38,0.4);
            ">
                <strong style="color: #fff;">🔒 ${type}</strong>
            </div>
        `;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    console.log('[BLOCKER] ☢️ NUCLEAR MODE ACTIVE - All navigation blocked');
})();
</script>
