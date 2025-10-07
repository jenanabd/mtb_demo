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
        let lastMessageContent = '';
        const messageDedupeWindow = 2000; // 2 seconds
        
        // Auto-remove duplicate messages with retry indicators
        function autoRemoveDuplicates() {
            const widgetObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for messages with retry/failed indicators
                            setTimeout(() => {
                                const retryMessages = node.querySelectorAll('[class*="retry"], [class*="failed"], [class*="error"], .message-failed');
                                retryMessages.forEach(function(retryEl) {
                                    const messageEl = retryEl.closest('.message') || retryEl.parentElement;
                                    if (messageEl) {
                                        const messageText = messageEl.textContent || messageEl.innerText;
                                        debugLog('🔄 Found message with retry indicator:', messageText.substring(0, 50));
                                        
                                        // Auto-remove after 2 seconds if it's a duplicate
                                        setTimeout(() => {
                                            if (messageEl.parentNode) {
                                                debugLog('🗑️ Auto-removing duplicate message');
                                                messageEl.style.opacity = '0';
                                                messageEl.style.transition = 'opacity 0.3s';
                                                setTimeout(() => {
                                                    if (messageEl.parentNode) {
                                                        messageEl.remove();
                                                    }
                                                }, 300);
                                            }
                                        }, 2000);
                                    }
                                });
                            }, 500);
                        }
                    });
                });
            });
            
            // Start observing widget
            const startWidgetObserving = function() {
                const widgetContainer = document.querySelector('.woot-widget-holder, #chatwoot-widget, [class*="chatwoot"], iframe');
                if (widgetContainer) {
                    widgetObserver.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    debugLog('🔍 Started auto-removal monitoring for duplicate messages');
                } else {
                    setTimeout(startWidgetObserving, 1000);
                }
            };
            
            startWidgetObserving();
        }
        
        // Start auto-removal
        autoRemoveDuplicates();
        
        // Intercept fetch requests to monitor API calls
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            
            if (typeof url === 'string' && url.includes('/api/v1/widget/messages')) {
                messageSendCount++;
                const currentTime = Date.now();
                
                // Extract message content from request body
                const requestBody = args[1]?.body;
                let messageContent = '';
                try {
                    if (requestBody) {
                        const parsedBody = JSON.parse(requestBody);
                        messageContent = parsedBody.content || parsedBody.message || '';
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
                
                debugLog(`📤 Message send attempt #${messageSendCount}`, {
                    url: url,
                    timestamp: currentTime,
                    timeSinceLastMessage: currentTime - lastMessageTimestamp,
                    content: messageContent.substring(0, 50)
                });
                
                // Check for potential duplicate
                if (messageContent === lastMessageContent && 
                    currentTime - lastMessageTimestamp < messageDedupeWindow) {
                    debugLog('⚠️ DUPLICATE MESSAGE DETECTED!', {
                        content: messageContent,
                        timeDifference: currentTime - lastMessageTimestamp,
                        dedupeWindow: messageDedupeWindow
                    });
                    
                    // Return a fake successful response to prevent the duplicate
                    return Promise.resolve(new Response(JSON.stringify({
                        id: Math.random().toString(36).substr(2, 9),
                        content: messageContent,
                        status: 'sent',
                        created_at: new Date().toISOString()
                    }), {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }));
                }
                
                lastMessageTimestamp = currentTime;
                lastMessageContent = messageContent;
                
                return originalFetch.apply(this, args)
                    .then(response => {
                        debugLog(`📨 Message API response: ${response.status}`, {
                            status: response.status,
                            statusText: response.statusText,
                            url: response.url
                        });
                        
                        if (!response.ok) {
                            debugLog(`❌ API Error: ${response.status} ${response.statusText}`);
                        } else {
                            debugLog('✅ Message sent successfully');
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
        },
        removeDuplicates: () => {
            debugLog('🧹 Manually removing duplicate messages...');
            
            // Find all message elements with retry/failed indicators
            const duplicateSelectors = [
                '[class*="retry"]',
                '[class*="failed"]',
                '[class*="error"]',
                '.message-failed',
                '.message-retry',
                '.chat-message-retry'
            ];
            
            let removedCount = 0;
            duplicateSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const messageEl = el.closest('.message') || el.parentElement;
                    if (messageEl) {
                        debugLog('🗑️ Removing duplicate message element');
                        messageEl.style.opacity = '0';
                        messageEl.style.transition = 'opacity 0.3s';
                        setTimeout(() => {
                            if (messageEl.parentNode) {
                                messageEl.remove();
                                removedCount++;
                            }
                        }, 300);
                    }
                });
            });
            
            // Also look for duplicate message content
            const allMessages = document.querySelectorAll('.message, .chat-bubble, [class*="message"]');
            const seenMessages = new Set();
            
            allMessages.forEach(messageEl => {
                const messageText = (messageEl.textContent || messageEl.innerText).trim();
                if (messageText && seenMessages.has(messageText)) {
                    // This is a duplicate
                    debugLog('🗑️ Removing duplicate message by content:', messageText.substring(0, 30));
                    messageEl.style.opacity = '0';
                    messageEl.style.transition = 'opacity 0.3s';
                    setTimeout(() => {
                        if (messageEl.parentNode) {
                            messageEl.remove();
                            removedCount++;
                        }
                    }, 300);
                } else if (messageText) {
                    seenMessages.add(messageText);
                }
            });
            
            setTimeout(() => {
                debugLog(`✅ Cleanup complete. Removed ${removedCount} duplicate messages.`);
            }, 1000);
            
            return removedCount;
        },
        clearChat: () => {
            debugLog('🧹 Clearing entire chat history...');
            const chatContainer = document.querySelector('.chat-container, .messages-container, [class*="messages"]');
            if (chatContainer) {
                chatContainer.innerHTML = '';
                debugLog('✅ Chat cleared');
            } else {
                debugLog('❌ Chat container not found');
            }
        }
    };
    
})();