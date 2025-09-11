// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add fade-in class to elements and observe them
const elementsToAnimate = document.querySelectorAll('.award-card, .service-card, .stat-card, .about-card');
elementsToAnimate.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Counter animation for statistics
const animateCounter = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        if (end > 999) {
            element.textContent = current.toLocaleString() + '+';
        } else {
            element.textContent = current;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// Animate counters when they come into view
const counterElements = document.querySelectorAll('.stat-number');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            const text = element.textContent.replace(/[+,]/g, '');
            const endValue = parseInt(text);
            
            if (!element.classList.contains('animated')) {
                element.classList.add('animated');
                animateCounter(element, 0, endValue, 2000);
            }
        }
    });
}, { threshold: 0.5 });

counterElements.forEach(el => {
    counterObserver.observe(el);
});

// Header background on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
});

// Form submission handling
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        // Show success message (in a real application, you would send this to a server)
        showNotification('Thank you for your message! We will get back to you soon.', 'success');
        
        // Reset form
        this.reset();
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#667eea'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Add loading animation to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Skip if it's a form submit or external link
        if (this.type === 'submit' || this.href && !this.href.startsWith('#')) {
            return;
        }
        
        // Add ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            if (this.contains(ripple)) {
                this.removeChild(ripple);
            }
        }, 600);
    });
});

// Add ripple animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(style);

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// Cookie management functions
const CookieManager = {
    // Set a cookie with expiration
    set: function(name, value, days = 0) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
    },
    
    // Get a cookie value
    get: function(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    
    // Delete a specific cookie
    delete: function(name) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Strict";
    },
    
    // Delete all cookies
    deleteAll: function() {
        const cookies = document.cookie.split(";");
        
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            if (name) {
                // Delete cookie for current path
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Strict";
                // Delete cookie for root path
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Strict";
                // Delete cookie for current domain
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=" + window.location.hostname + "; SameSite=Strict";
                // Delete cookie for parent domain (if subdomain)
                const hostParts = window.location.hostname.split('.');
                if (hostParts.length > 2) {
                    const parentDomain = '.' + hostParts.slice(-2).join('.');
                    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=" + parentDomain + "; SameSite=Strict";
                }
            }
        }
        
        // Also try to clear localStorage and sessionStorage for complete cleanup
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.log('Storage clearing not available or restricted');
        }
        
        console.log('All cookies and storage cleared');
    }
};

// Auto-delete cookies when tab is closed
function setupCookieAutoDelete() {
    // Set session cookies that will be deleted when browser closes
    CookieManager.set('mtb_session_active', 'true'); // Session cookie (no expiration)
    
    // Handle page unload (tab close, navigation away, browser close)
    window.addEventListener('beforeunload', function(event) {
        // Delete all cookies when tab is being closed
        CookieManager.deleteAll();
        
        // Optional: Show confirmation dialog (some browsers may ignore this)
        const message = 'Your session data will be cleared. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
    });
    
    // Handle page visibility change (when tab becomes hidden)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            // Store timestamp when tab becomes hidden
            CookieManager.set('mtb_tab_hidden_time', Date.now().toString());
        } else if (document.visibilityState === 'visible') {
            // Check if tab was hidden for more than 30 minutes, then clear cookies
            const hiddenTime = CookieManager.get('mtb_tab_hidden_time');
            if (hiddenTime) {
                const timeDiff = Date.now() - parseInt(hiddenTime);
                const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
                
                if (timeDiff > thirtyMinutes) {
                    CookieManager.deleteAll();
                    showNotification('Session expired due to inactivity. Cookies have been cleared.', 'info');
                }
            }
        }
    });
    
    // Handle page focus events
    window.addEventListener('focus', function() {
        // Check if session is still valid when user returns to tab
        const sessionActive = CookieManager.get('mtb_session_active');
        if (!sessionActive) {
            showNotification('Welcome back! Starting a fresh session.', 'info');
            CookieManager.set('mtb_session_active', 'true');
        }
    });
    
    // Periodic cleanup - check every 5 minutes if page is still active
    setInterval(function() {
        if (document.visibilityState === 'visible') {
            CookieManager.set('mtb_last_activity', Date.now().toString());
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth reveal animation to page sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = `all 0.6s ease ${index * 0.1}s`;
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100);
    });
    
    // Initialize cookie auto-delete feature
    setupCookieAutoDelete();
    
    console.log('MTB Landing Page loaded successfully with auto-delete cookies feature!');
});
