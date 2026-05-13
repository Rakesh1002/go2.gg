/**
 * WebMCP inline-script payload.
 *
 * Why inline: the WebMCP scanner ([SKILL.md](https://isitagentready.com/.well-known/agent-skills/webmcp/SKILL.md))
 * requires tools to register synchronously at page load — deferred / lazy
 * scripts are not detected. Keeping the payload as a plain string lets the
 * root layout drop it into <head> via dangerouslySetInnerHTML alongside the
 * existing JSON-LD block.
 *
 * The script registers tools through both the older `registerTool` API and
 * the newer `provideContext({ tools })` API so it passes detectors that
 * target either form of the WebMCP draft.
 */

export const WEBMCP_INLINE_SCRIPT = `(function(){
  try {
    if (typeof navigator === 'undefined') return;
    var mc = navigator.modelContext;
    if (!mc) return;

    var tools = [
      {
        name: 'search_docs',
        description: 'Search Go2 documentation by keyword and open the matching page.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Free-text search query.' }
          },
          required: ['query']
        },
        execute: async function (input) {
          var q = (input && input.query) || '';
          var url = '/docs?q=' + encodeURIComponent(q);
          if (typeof window !== 'undefined') window.location.assign(url);
          return { url: url };
        }
      },
      {
        name: 'create_short_link',
        description: 'Open the Go2 dashboard with a destination URL pre-filled to create a short link.',
        inputSchema: {
          type: 'object',
          properties: {
            destination: { type: 'string', format: 'uri', description: 'URL the short link should redirect to.' },
            slug: { type: 'string', description: 'Optional custom slug for the short link.' }
          },
          required: ['destination']
        },
        execute: async function (input) {
          var dest = (input && input.destination) || '';
          var slug = (input && input.slug) || '';
          var url = '/dashboard/links/new?url=' + encodeURIComponent(dest) + (slug ? '&slug=' + encodeURIComponent(slug) : '');
          if (typeof window !== 'undefined') window.location.assign(url);
          return { url: url };
        }
      },
      {
        name: 'view_link_analytics',
        description: 'Open the per-link analytics dashboard for a Go2 short link by its slug.',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Short-link slug (the path segment after go2.gg/).' }
          },
          required: ['slug']
        },
        execute: async function (input) {
          var slug = (input && input.slug) || '';
          var url = '/dashboard/analytics?slug=' + encodeURIComponent(slug);
          if (typeof window !== 'undefined') window.location.assign(url);
          return { url: url };
        }
      },
      {
        name: 'go_to_pricing',
        description: 'Navigate to the Go2 pricing page.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: async function () {
          var url = '/pricing';
          if (typeof window !== 'undefined') window.location.assign(url);
          return { url: url };
        }
      },
      {
        name: 'open_dashboard',
        description: 'Open the authenticated Go2 dashboard.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: async function () {
          var url = '/dashboard';
          if (typeof window !== 'undefined') window.location.assign(url);
          return { url: url };
        }
      }
    ];

    if (typeof mc.registerTool === 'function') {
      for (var i = 0; i < tools.length; i++) {
        try { mc.registerTool(tools[i]); } catch (_) {}
      }
    }
    if (typeof mc.provideContext === 'function') {
      try { mc.provideContext({ tools: tools }); } catch (_) {}
    }
  } catch (_) {}
})();`;
