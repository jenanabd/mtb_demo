// Chatwoot Debug and Monitoring Script
// Add this script to help diagnose and fix the duplicate message issue

(function() {
    'use strict';
    
    // Debug configuration
    const DEBUG = true;
    const LOG_PREFIX = '[Chatwoot Debug]';
    
    function debugLog(message, data = null) {
        if (DEBUG) {
            console.log(`${LOG_PREFIX} ${message}`, data || '');
        }
    }
    
    // Monitor Chatwoot widget loading
    let chatwootLoadAttempts = 0;
    const maxLoadAttempts = 5;
    
    function waitForChatwoot() {
        chatwootLoadAttempts++;
        
        if (window.chatwootSDK) {
            debugLog('Chatwoot SDK loaded successfully');
            setupChatwootMonitoring();
        } else if (chatwootLoadAttempts < maxLoadAttempts) {
            debugLog(`Waiting for Chatwoot SDK... (attempt ${chatwootLoadAttempts})`);
            setTimeout(waitForChatwoot, 1000);
        } else {
            debugLog('Failed to load Chatwoot SDK after maximum attempts');
        }
    }
    
    function setupChatwootMonitoring() {
        // Monitor message sending
        let messageSendCount = 0;
        let lastMessageTimestamp = 0;
        const messageDedupeWindow = 2000; // 2 seconds
        
        // Intercept fetch requests to monitor API calls
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            
            if (typeof url === 'string' && url.includes('/api/v1/widget/messages')) {
                messageSendCount++;
                const currentTime = Date.now();
                
                debugLog(`Message send attempt #${messageSendCount}`, {
                    url: url,
                    timestamp: currentTime,
                    timeSinceLastMessage: currentTime - lastMessageTimestamp
                });
                
                // Check for potential duplicate
                if (currentTime - lastMessageTimestamp < messageDedupeWindow) {
                    debugLog('⚠️ Potential duplicate message detected!', {
                        timeDifference: currentTime - lastMessageTimestamp,
                        dedupeWindow: messageDedupeWindow
                    });
                }
                
                lastMessageTimestamp = currentTime;
                
                return originalFetch.apply(this, args)
                    .then(response => {
                        debugLog(`Message API response: ${response.status}`, {
                            status: response.status,
                            statusText: response.statusText,
                            url: response.url
                        });
                        
                        if (!response.ok) {
                            debugLog(`❌ API Error: ${response.status} ${response.statusText}`);
                        }
                        
                        return response;
                    })
                    .catch(error => {
                        debugLog('❌ Network error:', error);
                        throw error;
                    });
            }
            
            return originalFetch.apply(this, args);
        };
        
        // Monitor widget events
        window.addEventListener('chatwoot:ready', function() {
            debugLog('✅ Chatwoot widget is ready');
        });
        
        window.addEventListener('chatwoot:error', function(event) {
            debugLog('❌ Chatwoot error event:', event.detail);
        });
        
        // Monitor for widget state changes
        let widgetState = 'closed';
        setInterval(function() {
            const widgetElement = document.querySelector('.woot-widget-holder');
            if (widgetElement) {
                const newState = widgetElement.style.display === 'none' ? 'closed' : 'open';
                if (newState !== widgetState) {
                    widgetState = newState;
                    debugLog(`Widget state changed to: ${widgetState}`);
                }
            }
        }, 1000);
        
        debugLog('Chatwoot monitoring setup complete');
    }
    
    // Performance monitoring
    function monitorPerformance() {
        debugLog('Performance monitoring started');
        
        // Monitor memory usage (if available)
        if (performance.memory) {
            setInterval(function() {
                const memory = performance.memory;
                debugLog('Memory usage:', {
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
                });
            }, 30000); // Every 30 seconds
        }
    }
    
    // Network monitoring
    function monitorNetworkStatus() {
        window.addEventListener('online', function() {
            debugLog('🌐 Network back online');
        });
        
        window.addEventListener('offline', function() {
            debugLog('📵 Network went offline');
        });
        
        debugLog(`Initial network status: ${navigator.onLine ? 'online' : 'offline'}`);
    }
    
    // Error reporting
    function setupErrorReporting() {
        window.addEventListener('error', function(event) {
            debugLog('💥 JavaScript error detected:', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });
        });
        
        window.addEventListener('unhandledrejection', function(event) {
            debugLog('💥 Unhandled promise rejection:', event.reason);
        });
    }
    
    // Initialize debugging
    debugLog('Chatwoot debug script initialized');
    
    // Start monitoring
    waitForChatwoot();
    monitorPerformance();
    monitorNetworkStatus();
    setupErrorReporting();
    
    // Expose debug functions globally for manual testing
    window.chatwootDebug = {
        getMessageCount: () => messageSendCount,
        getWidgetState: () => widgetState,
        forceReload: () => {
            debugLog('Force reloading Chatwoot widget...');
            if (window.chatwootSDK) {
                window.chatwootSDK.toggle('close');
                setTimeout(() => {
                    window.chatwootSDK.toggle('open');
                }, 1000);
            }
        }
    };
    
})();