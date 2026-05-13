/**
 * Cloaked Page Generator
 *
 * Generates an HTML page that displays the destination URL in an iframe
 * while keeping the short link URL visible in the browser address bar.
 *
 * Features:
 * - URL masking (cloaking)
 * - Custom OG metadata for social sharing
 * - Loading state with spinner
 * - X-Frame-Options bypass detection
 */

interface CloakedPageOptions {
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Generate an HTML page that cloaks (masks) the destination URL
 */
export function generateCloakedPage(
  destinationUrl: string,
  options: CloakedPageOptions = {}
): string {
  const { title, description, image } = options;

  // Extract domain from destination for default title
  let domain = "Go2";
  try {
    const url = new URL(destinationUrl);
    domain = url.hostname;
  } catch {
    // Invalid URL, use default
  }

  const pageTitle = title || domain;
  const pageDescription = description || `Redirecting to ${domain}`;
  const pageImage = image || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDescription)}">
  
  <!-- Open Graph metadata -->
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDescription)}">
  ${pageImage ? `<meta property="og:image" content="${escapeHtml(pageImage)}">` : ""}
  <meta property="og:type" content="website">
  
  <!-- Twitter Card metadata -->
  <meta name="twitter:card" content="${pageImage ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
  ${pageImage ? `<meta name="twitter:image" content="${escapeHtml(pageImage)}">` : ""}
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    #loading {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      z-index: 9999;
      transition: opacity 0.3s ease-out;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      margin-top: 16px;
      color: #6b7280;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    }
    
    #frame {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
    
    #error {
      display: none;
      position: fixed;
      inset: 0;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      z-index: 9998;
      padding: 20px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    #error h2 {
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    #error p {
      color: #6b7280;
      margin-bottom: 16px;
    }
    
    #error a {
      display: inline-block;
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    
    #error a:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <p class="loading-text">Loading...</p>
  </div>
  
  <div id="error">
    <h2>Cannot display this page</h2>
    <p>The destination page cannot be embedded. Click below to visit directly.</p>
    <a href="${escapeHtml(destinationUrl)}" id="direct-link">Continue to destination</a>
  </div>
  
  <iframe 
    id="frame"
    src="${escapeHtml(destinationUrl)}"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
  ></iframe>
  
  <script>
    (function() {
      var loading = document.getElementById('loading');
      var error = document.getElementById('error');
      var frame = document.getElementById('frame');
      var loaded = false;
      
      // Hide loading when iframe loads
      frame.onload = function() {
        if (!loaded) {
          loaded = true;
          loading.style.opacity = '0';
          setTimeout(function() {
            loading.style.display = 'none';
          }, 300);
        }
      };
      
      // Fallback: hide loading after timeout
      setTimeout(function() {
        if (!loaded) {
          loaded = true;
          loading.style.opacity = '0';
          setTimeout(function() {
            loading.style.display = 'none';
          }, 300);
        }
      }, 5000);
      
      // Handle iframe load errors (X-Frame-Options/CSP)
      frame.onerror = function() {
        loading.style.display = 'none';
        error.style.display = 'flex';
      };
      
      // Detect if the site blocks iframing via CSP
      // This is a workaround since onerror doesn't fire for CSP blocks
      setTimeout(function() {
        try {
          // If we can't access contentWindow, it might be blocked
          if (frame.contentWindow && frame.contentWindow.document) {
            // Check if the document is about:blank (load might have failed)
            var doc = frame.contentWindow.document;
            if (doc.body && doc.body.innerHTML === '' && !doc.documentElement.innerHTML.includes('<!DOCTYPE')) {
              loading.style.display = 'none';
              error.style.display = 'flex';
            }
          }
        } catch (e) {
          // Cross-origin access is expected, that's fine
        }
      }, 3000);
    })();
  </script>
</body>
</html>`;
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
