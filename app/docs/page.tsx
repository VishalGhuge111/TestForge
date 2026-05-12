'use client';

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import {
  ChevronDown, Code2, Zap, Menu, X,
  Shield, History, AlertCircle, Keyboard, BookOpen,
  Layers, Terminal, GitBranch, Database, Settings
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subsections: [
      { id: 'overview', title: 'Overview' },
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'interface-tour', title: 'Interface Tour' },
    ],
  },
  {
    id: 'api-inspection',
    title: 'API Inspection',
    subsections: [
      { id: 'making-requests', title: 'Making Requests' },
      { id: 'http-methods', title: 'HTTP Methods' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'headers', title: 'Headers & Body' },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    subsections: [
      { id: 'history-replay', title: 'History & Replay' },
      { id: 'response-inspector', title: 'Response Inspector' },
      { id: 'error-handling', title: 'Error Handling' },
      { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts' },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    subsections: [
      { id: 'assertions-overview', title: 'Assertions' },
      { id: 'collections-overview', title: 'Collections' },
      { id: 'env-overview', title: 'Environment Variables' },
      { id: 'debug-insights', title: 'Debug Insights' },
      { id: 'error-diagnostics', title: 'Error Diagnostics' },
      { id: 'saved-tests', title: 'Saved Tests & History' },
      { id: 'local-ai', title: 'Local AI Assistant' },
      { id: 'architecture', title: 'Architecture & Tech Stack' },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    subsections: [
      { id: 'api-reference', title: 'API Reference' },
      { id: 'faq', title: 'FAQ' },
    ],
  },
];

// ─── reusable primitives ─────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold mb-3 dark:text-white text-black">{children}</h1>;
}

function SubHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="text-xl font-semibold mt-8 mb-3 text-primary">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-6 mb-2 dark:text-white text-black">{children}</h3>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-muted-foreground leading-relaxed mb-4">{children}</p>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 text-sm text-muted-foreground leading-relaxed">
      <span className="font-semibold text-blue-400 mr-2">Note:</span>{children}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-sm text-muted-foreground leading-relaxed">
      <span className="font-semibold text-yellow-400 mr-2">Warning:</span>{children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-muted/50 border border-border/20 rounded-lg p-4 text-xs font-mono overflow-x-auto mb-4 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted/60 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
}

function Badge({ children, color = 'primary' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary/20 text-primary',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    accent: 'bg-accent/20 text-accent',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold font-mono ${colors[color]}`}>
      {children}
    </span>
  );
}

function TableOfContents({ items }: { items: { href: string; label: string }[] }) {
  const handleClick = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  return (
    <div className="my-6 p-4 rounded-lg border border-border/20 bg-muted/20">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">On this page</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <span
              onClick={() => handleClick(item.href)}
              className="text-sm text-primary hover:underline cursor-pointer"
            >
              → {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Divider() {
  return <hr className="my-8 border-border/20" />;
}

// ─── page sections ────────────────────────────────────────────────────────────

function OverviewSection() {
  const cards = [
    {
      icon: <Code2 className="w-6 h-6 text-primary" />,
      title: 'API Inspector',
      desc: 'Fire HTTP requests directly from your browser. Configure method, headers, auth, and body — then inspect the full response with formatted JSON, timing data, and status metadata.',
    },
    {
      icon: <History className="w-6 h-6 text-blue-400" />,
      title: 'Request History',
      desc: 'TestForge stores your last 30 requests locally. Replay any past call instantly, star favorites, and diff responses across runs — your full debugging session is always one click away.',
    },
    {
      icon: <Shield className="w-6 h-6 text-green-400" />,
      title: 'Secure Proxy',
      desc: 'All outbound requests are routed through a server-side proxy, preventing CORS issues and keeping credentials out of browser logs. No data is persisted server-side.',
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: 'Local AI Assistant',
      desc: 'An on-device AI assistant explains error messages, suggests assertions, and helps you craft request bodies — all without sending your API data to a third-party cloud.',
    },
    {
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      title: 'Collections & Environments',
      desc: 'Organise related requests into named collections and swap between local, staging, and production configs using environment variables — no editing requests required.',
    },
  ];

  return (
    <section>
      <h1 className="text-4xl font-bold mb-2 dark:text-white text-black">TestForge Documentation</h1>
      <Lead>TestForge is a browser-based API inspection and debugging workspace. Quickly fire HTTP requests, inspect responses, validate assertions, and debug APIs from a single interface.</Lead>

      <TableOfContents items={[
        { href: '#features', label: 'Core Features' },
        { href: '#howit', label: 'How it works' },
        { href: '#start', label: 'Where to start' },
      ]} />

      <SubHeading id="features">Core Features</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.title} className="p-5 rounded-lg border border-indigo-500/25 hover:border-indigo-400/50 transition bg-muted/10 shadow-sm">
            <div className="mb-3">{c.icon}</div>
            <h3 className="font-semibold mb-1.5 dark:text-white text-black text-sm">{c.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <Divider />

      <SubHeading id="howit">How It Works</SubHeading>
      <P>TestForge consists of three layers working together:</P>
      <ol className="list-decimal ml-5 space-y-3 text-sm text-muted-foreground mb-6">
        <li><strong className="dark:text-white text-black">Browser UI</strong> — A Next.js app where you configure and send requests. All state (history, saved tests, environment variables) lives in <InlineCode>localStorage</InlineCode> — nothing is sent to our servers.</li>
        <li><strong className="dark:text-white text-black">Server-side proxy</strong> — Your request is forwarded through a lightweight Next.js API route (<InlineCode>/api/request</InlineCode>). This eliminates CORS errors and prevents credentials from appearing in browser network logs.</li>
        <li><strong className="dark:text-white text-black">AI layer</strong> — An optional local AI model analyses the response structure and provides assertion suggestions, diagnostics, and debugging help. The model runs on your machine when available, or calls a privacy-respecting cloud endpoint as a fallback.</li>
      </ol>

      <Note>TestForge never stores your API payloads, tokens, or responses on any server. The proxy is stateless and processes each request independently.</Note>

      <Divider />

      <SubHeading id="start">Where to Start</SubHeading>
      <P>New to TestForge? Follow this path:</P>
      <div className="space-y-3">
        {[
          ['1', 'Read the Quick Start guide to fire your first request in under a minute.'],
          ['2', 'Take the Interface Tour to understand all three panels.'],
          ['3', 'Visit API Inspection → Making Requests for detailed configuration options.'],
          ['4', 'Explore Assertions and Debug Insights to validate responses and diagnose failures.'],
        ].map(([n, t]) => (
          <div key={n} className="flex gap-3 items-start text-sm text-muted-foreground">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{n}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickStartSection() {
  return (
    <section>
      <SectionHeading>Quick Start</SectionHeading>
      <Lead>Get from zero to your first successful API request in under 60 seconds.</Lead>

      <TableOfContents items={[
        { href: '#launch', label: 'Launch the Inspector' },
        { href: '#url', label: 'Enter an API URL' },
        { href: '#configure', label: 'Configure the Request' },
        { href: '#send', label: 'Send & Inspect' },
        { href: '#prereqs', label: 'Prerequisites' },
      ]} />

      <SubHeading id="prereqs">Prerequisites</SubHeading>
      <P>TestForge runs entirely in the browser. You need:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-6">
        <li>A modern browser (Chrome 110+, Firefox 115+, Safari 16+, Edge 110+)</li>
        <li>An API endpoint to test — a public one like <InlineCode>https://jsonplaceholder.typicode.com/posts</InlineCode> works fine</li>
        <li>No installation, no signup required for core features</li>
      </ul>

      <Divider />

      <SubHeading id="launch">Step 1 — Launch the Inspector</SubHeading>
      <P>Click the <strong className="dark:text-white text-black">Launch Inspector</strong> button in the top navigation bar. This opens the three-panel HTTP debugging workspace in full-screen mode. If you're on mobile, the layout collapses to a single-panel view with a tab switcher at the bottom.</P>

      <SubHeading id="url">Step 2 — Enter an API URL</SubHeading>
      <P>Paste or type your full API endpoint URL into the URL bar at the top of the centre panel. Always include the protocol:</P>
      <CodeBlock>{`# Correct
https://api.example.com/v1/users

# Also valid — query params inline
https://api.example.com/v1/users?page=1&limit=20

# Incorrect — missing protocol
api.example.com/v1/users`}</CodeBlock>
      <Note>TestForge supports both HTTP and HTTPS targets. For localhost development, use <InlineCode>http://localhost:3000/...</InlineCode> — the server-side proxy has no CORS restrictions.</Note>

      <SubHeading id="configure">Step 3 — Configure the Request</SubHeading>
      <P>Below the URL bar, configure your request:</P>
      <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground mb-4">
        <li><strong className="dark:text-white text-black">Method</strong> — Choose GET, POST, PUT, PATCH, or DELETE from the dropdown to the left of the URL bar.</li>
        <li><strong className="dark:text-white text-black">Headers</strong> — Open the Headers tab and add key-value pairs. Common example: <InlineCode>Authorization: Bearer &lt;token&gt;</InlineCode>.</li>
        <li><strong className="dark:text-white text-black">Body</strong> — For POST/PUT/PATCH, open the Body tab and paste a JSON payload. TestForge automatically sets <InlineCode>Content-Type: application/json</InlineCode>.</li>
        <li><strong className="dark:text-white text-black">Auth</strong> — Use the Auth tab for Basic Auth shortcut — TestForge handles the Base64 encoding for you.</li>
      </ul>

      <SubHeading id="send">Step 4 — Send & Inspect</SubHeading>
      <P>Click <strong className="dark:text-white text-black">Send Request</strong> (or press <InlineCode>Ctrl+Enter</InlineCode> / <InlineCode>⌘+Enter</InlineCode>). The right panel populates with:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>HTTP status code and status text (e.g. <InlineCode>200 OK</InlineCode>, <InlineCode>404 Not Found</InlineCode>)</li>
        <li>Response time in milliseconds and transfer size in bytes</li>
        <li>Response headers as a collapsible key-value list</li>
        <li>Response body as syntax-highlighted, collapsible JSON (or raw text for non-JSON)</li>
      </ul>
    </section>
  );
}

function InterfaceTourSection() {
  return (
    <section>
      <SectionHeading>Interface Tour</SectionHeading>
      <Lead>TestForge is organised into three resizable panels and a persistent top bar. Understanding the layout speeds up your workflow considerably.</Lead>

      <TableOfContents items={[
        { href: '#topbar', label: 'Top Bar' },
        { href: '#left', label: 'Left Panel — History' },
        { href: '#centre', label: 'Centre Panel — Request Builder' },
        { href: '#right', label: 'Right Panel — Response Inspector' },
        { href: '#mobile', label: 'Mobile Layout' },
      ]} />

      <SubHeading id="topbar">Top Bar</SubHeading>
      <P>The top bar is always visible and contains:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-6">
        <li><strong className="dark:text-white text-black">TestForge logo</strong> — clicking returns you to the landing page</li>
        <li><strong className="dark:text-white text-black">Docs</strong> — opens this documentation page</li>
        <li><strong className="dark:text-white text-black">Theme toggle</strong> — switches between dark and light mode; preference is persisted in <InlineCode>localStorage</InlineCode></li>
        <li><strong className="dark:text-white text-black">Feedback</strong> — opens a lightweight feedback form (data is anonymised)</li>
      </ul>

      <SubHeading id="left">Left Panel — History</SubHeading>
      <P>The History panel lives on the left side of the workspace and shows your last 30 requests in reverse-chronological order. Each entry displays:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>HTTP method badge (colour-coded)</li>
        <li>Shortened URL (full URL on hover)</li>
        <li>Response status code and elapsed time</li>
        <li>Timestamp relative to now (e.g. "3 min ago")</li>
        <li>Star icon to mark the request as a favourite</li>
      </ul>
      <P>Clicking any history entry loads the full request configuration into the centre panel — ready to re-send or modify. Starred items are sorted to the top of the list and persist across sessions.</P>
      <Note>History is stored in <InlineCode>localStorage</InlineCode> only. Clearing browser data removes it. For persistent collections, use the Collections feature.</Note>

      <SubHeading id="centre">Centre Panel — Request Builder</SubHeading>
      <P>The Request Builder is the main input area. It contains five tabs:</P>
      <div className="space-y-3 mb-6">
        {[
          ['Params', 'Add URL query parameters as key-value pairs. TestForge appends them to the URL automatically.'],
          ['Headers', 'Add custom HTTP headers. Values are masked for Authorization headers in the history view.'],
          ['Body', 'Enter a JSON request body for write methods. A basic JSON linter highlights syntax errors before you send.'],
          ['Auth', 'Shortcut panel for Basic Auth (username + password → Base64 header) and Bearer token entry.'],
          ['Settings', 'Per-request overrides: timeout (default 15 s), follow redirects toggle, SSL verification toggle.'],
        ].map(([tab, desc]) => (
          <div key={tab as string} className="flex gap-3 text-sm">
            <InlineCode>{tab as string}</InlineCode>
            <span className="text-muted-foreground">{desc as string}</span>
          </div>
        ))}
      </div>

      <SubHeading id="right">Right Panel — Response Inspector</SubHeading>
      <P>Once a request completes, the Response Inspector shows:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li><strong className="dark:text-white text-black">Status strip</strong> — colour-coded status code (green 2xx, yellow 3xx, red 4xx/5xx)</li>
        <li><strong className="dark:text-white text-black">Meta bar</strong> — duration, size, content-type</li>
        <li><strong className="dark:text-white text-black">Body tab</strong> — collapsible, syntax-highlighted JSON viewer; Copy button in the top-right corner</li>
        <li><strong className="dark:text-white text-black">Headers tab</strong> — full response headers as a searchable table</li>
        <li><strong className="dark:text-white text-black">Assertions tab</strong> — attach lightweight checks to the last response (see Assertions guide)</li>
      </ul>

      <SubHeading id="mobile">Mobile Layout</SubHeading>
      <P>On viewports narrower than 768 px, TestForge switches to a single-column layout:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>A hamburger icon (☰) in the top-left opens the History drawer as a full-height slide-in panel.</li>
        <li>The Request Builder and Response Inspector are stacked vertically — the response appears below the builder after a request completes.</li>
        <li>Keyboard shortcuts still work on Bluetooth keyboards paired to mobile devices.</li>
      </ul>
    </section>
  );
}

function MakingRequestsSection() {
  return (
    <section>
      <SectionHeading>Making Requests</SectionHeading>
      <Lead>TestForge routes all outbound requests through a server-side proxy, eliminating CORS friction and keeping credentials out of browser network logs.</Lead>

      <TableOfContents items={[
        { href: '#url', label: 'URL Configuration' },
        { href: '#proxy', label: 'Server-side Proxy' },
        { href: '#timeout', label: 'Timeout & Limits' },
        { href: '#redirect', label: 'Redirects' },
        { href: '#ssl', label: 'SSL Verification' },
      ]} />

      <SubHeading id="url">URL Configuration</SubHeading>
      <P>Enter the full URL — scheme, host, path, and optional query string — into the URL bar:</P>
      <CodeBlock>{`https://api.example.com/v2/users?page=2&per_page=50`}</CodeBlock>
      <P>Alternatively, use the <strong>Params tab</strong> to manage query parameters as individual key-value pairs. TestForge merges them into the URL before sending. Duplicate keys are preserved in order.</P>
      <Note>Path parameters (e.g. <InlineCode>/users/:id</InlineCode>) must be manually substituted in the URL bar. Environment variables (e.g. <InlineCode>{'{{userId}}'}</InlineCode>) are expanded before the request is sent.</Note>

      <SubHeading id="proxy">Server-side Proxy</SubHeading>
      <P>All requests are forwarded to <InlineCode>POST /api/request</InlineCode> on the TestForge backend, which then makes the outbound call server-side. This means:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>No CORS errors — the proxy is not subject to browser CORS policy.</li>
        <li>No browser network log exposure — credentials stay in the request body sent to your own proxy, not in DevTools network tabs visible to screen sharers.</li>
        <li>Works with any target including <InlineCode>localhost</InlineCode> (useful for local API development).</li>
      </ul>
      <Warning>Because the proxy sends requests from the server's IP, APIs protected by IP allowlisting may reject calls. Add your server's IP to the allowlist, or use a direct browser fetch for those endpoints.</Warning>

      <SubHeading id="timeout">Timeout & Limits</SubHeading>
      <P>The default request timeout is <strong>15 000 ms (15 s)</strong>. Override it per-request in the Settings tab. The maximum allowed timeout is 60 s. Requests that exceed the timeout return a <InlineCode>TIMEOUT</InlineCode> error with the actual elapsed time.</P>
      <P>Response bodies are capped at <strong>10 MB</strong>. Larger responses are truncated and a warning banner is shown in the Response Inspector.</P>

      <SubHeading id="redirect">Redirects</SubHeading>
      <P>By default, TestForge follows up to 5 HTTP redirects automatically (3xx responses). Each hop is recorded in the response metadata. Disable redirect following in the Settings tab to inspect the raw redirect response, including the <InlineCode>Location</InlineCode> header.</P>

      <SubHeading id="ssl">SSL Verification</SubHeading>
      <P>SSL certificate verification is enabled by default. For self-signed certificates on development servers, you can disable verification in the Settings tab. Never disable SSL verification when testing production endpoints.</P>
    </section>
  );
}

function HttpMethodsSection() {
  const methods = [
    { method: 'GET', color: 'primary', desc: 'Retrieve a resource or list of resources. GET requests must not have a request body. Use query parameters for filtering, sorting, and pagination. Safe and idempotent.', example: 'GET /api/users?role=admin&page=1' },
    { method: 'POST', color: 'accent', desc: 'Create a new resource. The request body contains the data for the new resource. Not idempotent — calling it twice creates two resources. Returns 201 Created on success.', example: 'POST /api/users\nContent-Type: application/json\n\n{ "name": "Jane Doe", "email": "jane@example.com" }' },
    { method: 'PUT', color: 'blue', desc: 'Replace an entire resource with the supplied representation. If the resource does not exist, some APIs create it. Idempotent — calling it multiple times produces the same result.', example: 'PUT /api/users/42\n\n{ "name": "Jane Doe", "email": "jane@example.com", "role": "admin" }' },
    { method: 'PATCH', color: 'green', desc: 'Partially update a resource. Only the fields included in the body are modified. More efficient than PUT when updating a single field. Not always idempotent — depends on API design.', example: 'PATCH /api/users/42\n\n{ "email": "jane.new@example.com" }' },
    { method: 'DELETE', color: 'red', desc: 'Remove a resource. Returns 204 No Content or 200 OK on success. Idempotent — deleting an already-deleted resource should return 404, not an error.', example: 'DELETE /api/users/42' },
  ];

  const colorMap: Record<string, string> = { primary: 'border-primary/30 bg-primary/5', accent: 'border-accent/30 bg-accent/5', blue: 'border-blue-500/30 bg-blue-500/5', green: 'border-green-500/30 bg-green-500/5', red: 'border-red-500/30 bg-red-500/5' };

  return (
    <section>
      <SectionHeading>HTTP Methods</SectionHeading>
      <Lead>TestForge supports all five standard HTTP methods. Each has a distinct semantic meaning — choosing the right method is essential for correctly interacting with RESTful APIs.</Lead>

      <TableOfContents items={methods.map(m => ({ href: `#${m.method.toLowerCase()}`, label: m.method }))} />

      <div className="space-y-6 mt-6">
        {methods.map((m) => (
          <div key={m.method} id={m.method.toLowerCase()} className={`rounded-lg border p-5 ${colorMap[m.color]}`}>
            <div className="flex items-center gap-3 mb-3">
              <Badge color={m.color}>{m.method}</Badge>
              <span className="text-xs text-muted-foreground">HTTP/1.1</span>
            </div>
            <P>{m.desc}</P>
            <CodeBlock>{m.example}</CodeBlock>
          </div>
        ))}
      </div>

      <Divider />
      <SubHeading>Method Safety & Idempotency</SubHeading>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safe</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Idempotent</th>
              <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Typical Response</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ['GET','✓','✓','200 OK'],
              ['POST','✗','✗','201 Created'],
              ['PUT','✗','✓','200 OK / 204'],
              ['PATCH','✗','Sometimes','200 OK'],
              ['DELETE','✗','✓','204 No Content'],
            ].map(([m,s,i,r]) => (
              <tr key={m} className="border-b border-border/10">
                <td className="py-2 pr-4"><InlineCode>{m}</InlineCode></td>
                <td className="py-2 pr-4">{s}</td>
                <td className="py-2 pr-4">{i}</td>
                <td className="py-2">{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuthenticationSection() {
  return (
    <section>
      <SectionHeading>Authentication</SectionHeading>
      <Lead>TestForge provides dedicated UI for the most common authentication schemes, so you never have to manually encode credentials or craft complex header values.</Lead>

      <TableOfContents items={[
        { href: '#basic', label: 'Basic Auth' },
        { href: '#bearer', label: 'Bearer Token' },
        { href: '#apikey', label: 'API Key' },
        { href: '#oauth', label: 'OAuth 2.0 Notes' },
        { href: '#security', label: 'Security Considerations' },
      ]} />

      <SubHeading id="basic">Basic Authentication</SubHeading>
      <P>Basic Auth encodes a username and password as a Base64 string and sends it in the <InlineCode>Authorization</InlineCode> header on every request.</P>
      <P>In TestForge: open the <strong>Auth tab</strong> → select <strong>Basic Auth</strong> → enter your username and password. TestForge generates the header automatically:</P>
      <CodeBlock>{`Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=`}</CodeBlock>
      <Warning>Basic Auth over plain HTTP sends credentials in a trivially reversible encoding. Always use HTTPS with Basic Auth.</Warning>

      <SubHeading id="bearer">Bearer Token</SubHeading>
      <P>Bearer tokens (used by OAuth 2.0, JWT, and many modern APIs) are sent as:</P>
      <CodeBlock>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</CodeBlock>
      <P>In TestForge: open the <strong>Auth tab</strong> → select <strong>Bearer Token</strong> → paste your token. Alternatively, add it directly in the Headers tab. TestForge masks bearer tokens in the History panel — only the first 8 characters are shown.</P>

      <SubHeading id="apikey">API Key</SubHeading>
      <P>APIs differ on where they expect the key — some use a header, others a query parameter:</P>
      <CodeBlock>{`# Header-based (most common)
X-API-Key: sk_live_abc123...

# Query parameter-based
GET /endpoint?api_key=sk_live_abc123...`}</CodeBlock>
      <P>For header-based keys, add them in the <strong>Headers tab</strong>. For query-parameter keys, add them in the <strong>Params tab</strong>. You can also store the key in an environment variable (e.g. <InlineCode>{'{{API_KEY}}'}</InlineCode>) to avoid hardcoding it.</P>

      <SubHeading id="oauth">OAuth 2.0 Notes</SubHeading>
      <P>TestForge does not currently have a built-in OAuth flow. To test OAuth-protected APIs:</P>
      <ol className="list-decimal ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>Obtain an access token externally (e.g. via your app's login flow, or a tool like Postman's OAuth helper).</li>
        <li>Paste the access token into the <strong>Bearer Token</strong> field in TestForge.</li>
        <li>Note the token expiry — TestForge does not refresh tokens automatically.</li>
      </ol>

      <SubHeading id="security">Security Considerations</SubHeading>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground">
        <li>All credential values are stored in <InlineCode>localStorage</InlineCode> — encrypted at rest by the browser, but accessible to any JS running on the same origin.</li>
        <li>Avoid saving production credentials in TestForge history. Use environment variables and load them from a secure secrets manager when possible.</li>
        <li>The server-side proxy does not log request headers. Credentials never appear in server logs.</li>
      </ul>
    </section>
  );
}

function HeadersSection() {
  return (
    <section>
      <SectionHeading>Headers & Body</SectionHeading>
      <Lead>Fine-grained control over request headers and body gives you the flexibility to test any API — from simple REST endpoints to complex GraphQL mutations.</Lead>

      <TableOfContents items={[
        { href: '#headers', label: 'Custom Headers' },
        { href: '#common', label: 'Common Header Patterns' },
        { href: '#body', label: 'Request Body' },
        { href: '#content', label: 'Content-Type Handling' },
        { href: '#size', label: 'Body Size Limits' },
      ]} />

      <SubHeading id="headers">Custom Headers</SubHeading>
      <P>Open the <strong>Headers tab</strong> in the Request Builder to add, edit, or remove headers. Each header is a key-value pair. TestForge validates key format (no whitespace, valid characters) and warns on common mistakes like <InlineCode>Content-type</InlineCode> instead of <InlineCode>Content-Type</InlineCode>.</P>
      <P>Headers are case-insensitive per the HTTP spec, but TestForge preserves the casing you enter for display purposes.</P>

      <SubHeading id="common">Common Header Patterns</SubHeading>
      <CodeBlock>{`# JSON API
Content-Type: application/json
Accept: application/json

# Form submission
Content-Type: application/x-www-form-urlencoded

# File upload
Content-Type: multipart/form-data

# Auth
Authorization: Bearer <token>

# Custom correlation ID (useful for distributed tracing)
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000

# API versioning
X-API-Version: 2
# or
Accept: application/vnd.api+json;version=2`}</CodeBlock>

      <SubHeading id="body">Request Body</SubHeading>
      <P>The <strong>Body tab</strong> is enabled for POST, PUT, and PATCH requests. TestForge provides a code editor with:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>JSON syntax highlighting and bracket matching</li>
        <li>Real-time JSON linting — a red underline marks syntax errors before you send</li>
        <li>Format button (<InlineCode>Shift+Alt+F</InlineCode>) — pretty-prints minified JSON</li>
        <li>Minify button — collapses JSON to a single line</li>
      </ul>

      <SubHeading id="content">Content-Type Handling</SubHeading>
      <P>When you add a body, TestForge sets <InlineCode>Content-Type: application/json</InlineCode> automatically. Override it in the Headers tab if your API expects a different content type (e.g. XML, form-encoded, plain text).</P>
      <Note>If you manually set <InlineCode>Content-Type: application/x-www-form-urlencoded</InlineCode>, enter the body as a URL-encoded string: <InlineCode>name=Jane&amp;email=jane%40example.com</InlineCode>.</Note>

      <SubHeading id="size">Body Size Limits</SubHeading>
      <P>The proxy accepts request bodies up to <strong>5 MB</strong>. For larger payloads (e.g. file uploads), consider using a dedicated tool or the Multipart option (coming soon). Attempting to send a body over the limit returns a <InlineCode>413 Payload Too Large</InlineCode> error from the proxy itself.</P>
    </section>
  );
}

function HistoryReplaySection() {
  return (
    <section>
      <SectionHeading>History & Replay</SectionHeading>
      <Lead>TestForge maintains a local history of your last 30 requests, making it easy to replay, compare, and iterate on API calls without re-entering configuration manually.</Lead>

      <TableOfContents items={[
        { href: '#storage', label: 'Storage & Persistence' },
        { href: '#view', label: 'Viewing History' },
        { href: '#replay', label: 'Replaying Requests' },
        { href: '#favorites', label: 'Favourites' },
        { href: '#clear', label: 'Clearing History' },
      ]} />

      <SubHeading id="storage">Storage & Persistence</SubHeading>
      <P>History is stored in <InlineCode>localStorage</InlineCode> under the key <InlineCode>testforge:history</InlineCode>. It persists across browser sessions until you clear it manually or the browser clears local storage. The history is scoped to the current origin — history on <InlineCode>localhost:3000</InlineCode> and <InlineCode>app.testforge.io</InlineCode> are separate.</P>
      <P>Each history entry stores: method, URL, request headers (with sensitive values masked), request body, response status, response body (up to 100 KB), duration, and timestamp.</P>
      <Note>The 30-entry limit prevents unbounded localStorage growth. When the limit is reached, the oldest non-starred entry is evicted automatically.</Note>

      <SubHeading id="view">Viewing History</SubHeading>
      <P>The History panel on the left lists entries in reverse-chronological order. Each entry shows:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>Method badge (colour-coded by method type)</li>
        <li>URL — truncated with an ellipsis; hover for the full URL tooltip</li>
        <li>Status code chip (green 2xx, yellow 3xx, red 4xx/5xx)</li>
        <li>Duration in milliseconds</li>
        <li>Relative timestamp ("2 min ago", "Yesterday")</li>
      </ul>
      <P>Use the search bar at the top of the History panel to filter by URL substring or status code.</P>

      <SubHeading id="replay">Replaying Requests</SubHeading>
      <P>Click any history entry to load its full configuration into the Request Builder. The URL, method, headers, body, and auth are all restored. The current request builder contents are replaced — save or star the current request first if you need to keep it.</P>
      <P>After loading from history, click <strong>Send Request</strong> to re-execute. The new response is added as a fresh history entry — the original entry is preserved unchanged.</P>

      <SubHeading id="favorites">Favourites</SubHeading>
      <P>Click the star (☆) on any history entry to mark it as a favourite. Starred entries:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>Are sorted to the top of the history panel</li>
        <li>Are never evicted when the 30-entry limit is reached</li>
        <li>Can be filtered by toggling the "Starred only" switch in the history panel header</li>
      </ul>

      <SubHeading id="clear">Clearing History</SubHeading>
      <P>Click the trash icon in the history panel header to clear all non-starred entries. To clear everything including starred entries, hold <InlineCode>Shift</InlineCode> while clicking the trash icon. This is irreversible.</P>
    </section>
  );
}

function ResponseInspectorSection() {
  return (
    <section>
      <SectionHeading>Response Inspector</SectionHeading>
      <Lead>The Response Inspector gives you a rich, navigable view of every detail of an HTTP response — from status code to nested JSON fields.</Lead>

      <TableOfContents items={[
        { href: '#meta', label: 'Response Metadata' },
        { href: '#body', label: 'Body Viewer' },
        { href: '#headers', label: 'Response Headers' },
        { href: '#copy', label: 'Copying Data' },
        { href: '#diff', label: 'Response Diff' },
      ]} />

      <SubHeading id="meta">Response Metadata</SubHeading>
      <P>The metadata strip at the top of the Response panel shows at a glance:</P>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {[
          ['Status', '200 OK — colour-coded by class'],
          ['Duration', 'Total round-trip time in ms'],
          ['Size', 'Transfer size (compressed) and decoded size'],
          ['Type', 'Content-Type returned by the server'],
        ].map(([k, v]) => (
          <div key={k} className="p-3 rounded-lg border border-border/20 bg-muted/10">
            <p className="text-xs font-semibold text-primary mb-1">{k}</p>
            <p className="text-xs text-muted-foreground">{v}</p>
          </div>
        ))}
      </div>

      <SubHeading id="body">Body Viewer</SubHeading>
      <P>The body viewer renders JSON with full syntax highlighting. Large responses (over 50 KB) are paginated — use the pagination controls to navigate deep arrays. Features:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li><strong className="dark:text-white text-black">Collapse / expand</strong> — click any object or array to collapse it. Double-click to expand all children.</li>
        <li><strong className="dark:text-white text-black">Search</strong> — <InlineCode>Ctrl+F</InlineCode> opens an inline search bar that highlights matching keys and values.</li>
        <li><strong className="dark:text-white text-black">Path breadcrumb</strong> — when you click into a nested value, a breadcrumb appears above the viewer showing the full JSON path (e.g. <InlineCode>data.users[0].address.city</InlineCode>).</li>
        <li><strong className="dark:text-white text-black">Raw toggle</strong> — switch to the raw view to see the unformatted, uncoloured response body as-sent.</li>
      </ul>

      <SubHeading id="headers">Response Headers</SubHeading>
      <P>The <strong>Headers</strong> tab shows all response headers as a sortable, searchable table. Click a header name to sort alphabetically; click a header value to copy it to the clipboard.</P>

      <SubHeading id="copy">Copying Data</SubHeading>
      <P>Three copy buttons live in the top-right corner of the Response panel:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li><strong className="dark:text-white text-black">Copy Body</strong> — copies the formatted JSON body</li>
        <li><strong className="dark:text-white text-black">Copy as cURL</strong> — generates a <InlineCode>curl</InlineCode> command that reproduces the exact request</li>
        <li><strong className="dark:text-white text-black">Copy as Fetch</strong> — generates a <InlineCode>fetch()</InlineCode> call for use in JavaScript code</li>
      </ul>

      <SubHeading id="diff">Response Diff</SubHeading>
      <P>Select any two history entries and click <strong>Diff Responses</strong> to see a side-by-side comparison of their response bodies. Added fields are highlighted green, removed fields red, and changed values yellow. This is particularly useful when debugging regressions or comparing API versions.</P>
    </section>
  );
}

function ErrorHandlingSection() {
  return (
    <section>
      <SectionHeading>Error Handling</SectionHeading>
      <Lead>TestForge categorises every error clearly and provides actionable diagnostic hints to help you resolve issues quickly.</Lead>

      <TableOfContents items={[
        { href: '#categories', label: 'Error Categories' },
        { href: '#network', label: 'Network Errors' },
        { href: '#timeout', label: 'Timeout Errors' },
        { href: '#api', label: 'API (HTTP) Errors' },
        { href: '#proxy', label: 'Proxy Errors' },
        { href: '#hints', label: 'Diagnostic Hints' },
      ]} />

      <SubHeading id="categories">Error Categories</SubHeading>
      <div className="space-y-3 mb-6">
        {[
          { cat: 'NETWORK', color: 'border-red-500/30 bg-red-500/5', hcolor: 'text-red-400', desc: 'The proxy could not establish a TCP connection to the target host. Common causes: wrong hostname, firewall blocking the connection, or the server is down.' },
          { cat: 'TIMEOUT', color: 'border-yellow-500/30 bg-yellow-500/5', hcolor: 'text-yellow-400', desc: 'The server accepted the connection but did not send a complete response within the configured timeout. Common causes: slow database query, high server load, infinite loop.' },
          { cat: 'HTTP_ERROR', color: 'border-blue-500/30 bg-blue-500/5', hcolor: 'text-blue-400', desc: 'The server responded with a 4xx or 5xx status code. This is a valid HTTP response — the body usually contains error details from the API.' },
          { cat: 'PROXY_ERROR', color: 'border-purple-500/30 bg-purple-500/5', hcolor: 'text-purple-400', desc: 'An error occurred in the TestForge proxy itself (not the target API). Rare — typically caused by oversized request bodies or internal server issues.' },
          { cat: 'PARSE_ERROR', color: 'border-orange-500/30 bg-orange-500/5', hcolor: 'text-orange-400', desc: 'The response body could not be parsed as JSON despite the Content-Type being application/json. Common causes: malformed JSON, HTML error page returned instead of JSON.' },
        ].map(({ cat, color, hcolor, desc }) => (
          <div key={cat} id={cat.toLowerCase()} className={`rounded-lg border p-4 ${color}`}>
            <p className={`text-sm font-bold font-mono mb-1.5 ${hcolor}`}>{cat}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <SubHeading id="hints">Diagnostic Hints</SubHeading>
      <P>When an error occurs, TestForge displays a <strong>Diagnostic Hints</strong> section below the error badge. Hints are tailored to the error type and observed details. Examples:</P>
      <CodeBlock>{`NETWORK ERROR: connect ECONNREFUSED 127.0.0.1:8080

Hints:
  • Is your local development server running?
    Start it with: npm run dev (or your project's start command)
  • If targeting a Docker container, make sure the port is exposed
    and the container is running: docker ps
  • Check for typos in the host or port number`}</CodeBlock>
    </section>
  );
}

function KeyboardShortcutsSection() {
  const shortcuts = [
    { keys: 'Ctrl+Enter', mac: '⌘+Enter', action: 'Send the current request' },
    { keys: 'Escape', mac: 'Esc', action: 'Cancel an in-flight request' },
    { keys: 'Ctrl+F', mac: '⌘+F', action: 'Search in the response body viewer' },
    { keys: 'Shift+Alt+F', mac: '⇧+⌥+F', action: 'Format / pretty-print the request body JSON' },
    { keys: 'Ctrl+Shift+C', mac: '⌘+⇧+C', action: 'Copy response body to clipboard' },
    { keys: 'Ctrl+K', mac: '⌘+K', action: 'Open command palette (search all sections)' },
    { keys: 'Ctrl+H', mac: '⌘+H', action: 'Toggle history panel' },
    { keys: 'Ctrl+/', mac: '⌘+/', action: 'Open keyboard shortcuts reference' },
    { keys: 'Ctrl+S', mac: '⌘+S', action: 'Save current request to favourites' },
    { keys: 'Ctrl+D', mac: '⌘+D', action: 'Duplicate current request' },
  ];

  return (
    <section>
      <SectionHeading>Keyboard Shortcuts</SectionHeading>
      <Lead>TestForge is fully keyboard-navigable. Mastering these shortcuts significantly speeds up your debugging workflow.</Lead>

      <div className="mt-6 rounded-lg border border-border/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/20 bg-muted/20">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Windows / Linux</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">macOS</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map(({ keys, mac, action }, i) => (
              <tr key={keys} className={`border-b border-border/10 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                <td className="py-2.5 px-4 text-sm text-muted-foreground">{action}</td>
                <td className="py-2.5 px-4"><kbd className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{keys}</kbd></td>
                <td className="py-2.5 px-4"><kbd className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{mac}</kbd></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Note>Keyboard shortcuts are disabled when focus is inside a text input or the response body search bar. Press <InlineCode>Escape</InlineCode> to blur the input and restore global shortcuts.</Note>
    </section>
  );
}

function AssertionsSection() {
  return (
    <section>
      <SectionHeading>Assertions</SectionHeading>
      <Lead>Assertions are lightweight, declarative checks attached to requests. They run automatically whenever a request is replayed or re-sent, giving you instant validation feedback without writing code.</Lead>

      <TableOfContents items={[
        { href: '#types', label: 'Assertion Types' },
        { href: '#add', label: 'Adding Assertions' },
        { href: '#running', label: 'Running & Results' },
        { href: '#export', label: 'Exporting as Tests' },
      ]} />

      <SubHeading id="types">Assertion Types</SubHeading>
      <div className="space-y-3 mb-6">
        {[
          { type: 'Status Code', syntax: 'status == 200', desc: 'Checks the HTTP response status code. Supports ==, !=, >, < and ranges like 2xx.' },
          { type: 'Response Time', syntax: 'duration < 1000', desc: 'Validates that the request completed within a threshold (in milliseconds).' },
          { type: 'Header Exists', syntax: 'header["x-request-id"] exists', desc: 'Checks that a specific response header is present, regardless of value.' },
          { type: 'Header Value', syntax: 'header["content-type"] contains "json"', desc: 'Checks that a header value matches a string, regex, or exact value.' },
          { type: 'Body Field', syntax: 'body.data.id == 42', desc: 'Validates a field in the JSON response body using dot-notation paths.' },
          { type: 'Body Contains', syntax: 'body contains "success"', desc: 'Checks that the raw response body string contains a substring.' },
          { type: 'JSON Schema', syntax: 'body matches schema', desc: 'Validates the full response body against a JSON Schema you provide.' },
        ].map(({ type, syntax, desc }) => (
          <div key={type} className="p-4 rounded-lg border border-border/20">
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <p className="text-sm font-semibold dark:text-white text-black">{type}</p>
              <InlineCode>{syntax}</InlineCode>
            </div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <SubHeading id="add">Adding Assertions</SubHeading>
      <P>After a response is loaded, open the <strong>Assertions</strong> tab in the Response panel:</P>
      <ol className="list-decimal ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>Click <strong>Add Assertion</strong>.</li>
        <li>Select the assertion type from the dropdown.</li>
        <li>Enter the expected value or condition.</li>
        <li>Click <strong>Save</strong>. The assertion is immediately evaluated against the current response.</li>
      </ol>
      <P>Assertions are attached to the request entry in history — they persist and re-run every time you replay that request.</P>

      <SubHeading id="running">Running & Results</SubHeading>
      <P>Assertion results are displayed as pass (✓ green) or fail (✗ red) badges next to each assertion. A summary chip on the history entry shows the pass/fail ratio. Hovering a failing assertion shows the actual vs. expected value.</P>

      <SubHeading id="export">Exporting as Tests</SubHeading>
      <P>Click <strong>Export Assertions as Tests</strong> to convert your saved assertions into a runnable test file in your chosen framework. This is a quick way to bootstrap a test suite without using the full AI generation flow.</P>
    </section>
  );
}

function CollectionsSection() {
  return (
    <section>
      <SectionHeading>Collections</SectionHeading>
      <Lead>Collections let you organise related requests into named groups, run them as a batch, and share them with teammates.</Lead>

      <SubHeading>Creating a Collection</SubHeading>
      <P>In the History panel, click <strong>New Collection</strong>. Give it a name (e.g. "User API", "Checkout Flow"). Then drag history entries into the collection, or click the collection badge icon on any history entry.</P>

      <SubHeading>Running a Collection</SubHeading>
      <P>Open a collection and click <strong>Run All</strong>. TestForge executes each request sequentially, captures responses, and evaluates assertions. A summary report shows pass/fail status for each request. Results are saved to history as a collection run entry.</P>

      <SubHeading>Exporting & Importing</SubHeading>
      <P>Collections are exported as a JSON file you can share with teammates or import into other TestForge workspaces. The export format includes all request configurations (headers, body, auth) but masks credential values for safety.</P>
      <CodeBlock>{`# Example collection export format
{
  "name": "User API",
  "version": "1.0",
  "requests": [
    {
      "id": "req_01",
      "name": "List Users",
      "method": "GET",
      "url": "{{BASE_URL}}/api/users",
      "headers": { "Authorization": "Bearer {{TOKEN}}" },
      "assertions": [
        { "type": "status", "expected": 200 }
      ]
    }
  ]
}`}</CodeBlock>

      <Note>Credential values (Authorization headers, API keys) are replaced with placeholder variable references (e.g. <InlineCode>{'{{TOKEN}}'}</InlineCode>) on export. The recipient must configure these values in their own environment.</Note>
    </section>
  );
}

function EnvVarsSection() {
  return (
    <section>
      <SectionHeading>Environment Variables</SectionHeading>
      <Lead>Environment variables let you parameterise requests so you can switch between local, staging, and production configurations without editing individual requests.</Lead>

      <SubHeading>Defining Variables</SubHeading>
      <P>Open <strong>Settings → Environments</strong>. Create an environment (e.g. "Local", "Staging", "Production") and define key-value pairs:</P>
      <CodeBlock>{`# Local environment
BASE_URL = http://localhost:3000
TOKEN    = dev_token_abc123
USER_ID  = 1

# Production environment
BASE_URL = https://api.example.com
TOKEN    = <load from secrets manager>
USER_ID  = 42`}</CodeBlock>

      <SubHeading>Using Variables</SubHeading>
      <P>Reference variables anywhere in a request using double-brace syntax: <InlineCode>{'{{VARIABLE_NAME}}'}</InlineCode>. They work in:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>URL bar: <InlineCode>{'{{BASE_URL}}/api/users/{{USER_ID}}'}</InlineCode></li>
        <li>Header values: <InlineCode>{'Authorization: Bearer {{TOKEN}}'}</InlineCode></li>
        <li>Request body: <InlineCode>{'{ "userId": "{{USER_ID}}" }'}</InlineCode></li>
        <li>Query params: <InlineCode>{'?api_key={{API_KEY}}'}</InlineCode></li>
      </ul>

      <SubHeading>Scope & Resolution</SubHeading>
      <P>Variables are resolved in this order (most specific wins):</P>
      <ol className="list-decimal ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li><strong className="dark:text-white text-black">Request-level</strong> — variables defined inline on a single request</li>
        <li><strong className="dark:text-white text-black">Collection-level</strong> — variables defined on the collection containing the request</li>
        <li><strong className="dark:text-white text-black">Environment-level</strong> — variables in the active environment</li>
        <li><strong className="dark:text-white text-black">Global</strong> — variables defined in Settings → Global Variables</li>
      </ol>

      <Warning>Never commit environment files containing production credentials to version control. Use a secrets manager or CI/CD secret injection for sensitive values.</Warning>
    </section>
  );
}

function DebugInsightsSection() {
  return (
    <section>
      <SectionHeading>Debug Insights</SectionHeading>
      <Lead>Debug Insights surfaces timing breakdowns, header diffs, and payload analysis to help you pinpoint performance regressions and unexpected API behaviour.</Lead>

      <SubHeading>Timing Breakdown</SubHeading>
      <P>The Timing tab in the Response Inspector shows a waterfall breakdown of the request lifecycle:</P>
      <div className="space-y-2 mb-4">
        {[
          ['DNS Lookup', 'Time to resolve the hostname to an IP address'],
          ['TCP Connect', 'Time to establish the TCP connection'],
          ['TLS Handshake', 'Time to negotiate the SSL/TLS session (HTTPS only)'],
          ['Time to First Byte', 'Time from sending the request to receiving the first byte of the response'],
          ['Content Download', 'Time to download the full response body'],
        ].map(([phase, desc]) => (
          <div key={phase as string} className="flex gap-3 text-sm">
            <span className="shrink-0 w-40 text-xs font-mono text-primary">{phase as string}</span>
            <span className="text-xs text-muted-foreground">{desc as string}</span>
          </div>
        ))}
      </div>

      <SubHeading>Header Diff</SubHeading>
      <P>Select two history entries for the same endpoint and click <strong>Diff Headers</strong> to compare response headers. Useful for spotting when a server starts or stops returning caching headers, CORS headers, or rate-limit headers.</P>

      <SubHeading>Payload Size Analysis</SubHeading>
      <P>The <strong>Size Breakdown</strong> panel shows compressed vs uncompressed size. A high compression ratio (over 5:1) is normal for JSON. An unexpectedly large uncompressed payload may indicate the API is returning unnecessary fields — consider requesting a sparse fieldset.</P>
    </section>
  );
}

function ErrorDiagnosticsSection() {
  return (
    <section>
      <SectionHeading>Error Diagnostics</SectionHeading>
      <Lead>Every error in TestForge comes with a categorised code, probable causes, and concrete next steps to reproduce or resolve the issue.</Lead>

      <SubHeading>Diagnostic Card Structure</SubHeading>
      <P>Each error diagnostic card contains:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li><strong className="dark:text-white text-black">Error code</strong> — e.g. <InlineCode>ECONNREFUSED</InlineCode>, <InlineCode>ETIMEDOUT</InlineCode>, <InlineCode>HTTP_404</InlineCode></li>
        <li><strong className="dark:text-white text-black">Category</strong> — Network, Timeout, HTTP, Proxy, or Parse</li>
        <li><strong className="dark:text-white text-black">Summary</strong> — one-line plain-English description</li>
        <li><strong className="dark:text-white text-black">Probable causes</strong> — 2–4 ranked by likelihood based on the error context</li>
        <li><strong className="dark:text-white text-black">Next steps</strong> — actionable commands or UI actions to investigate further</li>
        <li><strong className="dark:text-white text-black">Copy as cURL</strong> — a <InlineCode>curl</InlineCode> command to reproduce the failing request in a terminal</li>
      </ul>

      <SubHeading>Common Error Reference</SubHeading>
      <div className="space-y-3">
        {[
          { code: 'ECONNREFUSED', cause: 'Server not running on target port', fix: 'Start your dev server; check port number' },
          { code: 'ENOTFOUND', cause: 'DNS resolution failed for hostname', fix: 'Check hostname spelling; verify DNS settings' },
          { code: 'ETIMEDOUT', cause: 'Request exceeded timeout threshold', fix: 'Increase timeout in Settings tab; check server load' },
          { code: 'HTTP_401', cause: 'Missing or invalid authentication credentials', fix: 'Check your token in the Auth tab; verify it hasn\'t expired' },
          { code: 'HTTP_403', cause: 'Authenticated but not authorised', fix: 'Check role/permission for this endpoint' },
          { code: 'HTTP_429', cause: 'Rate limit exceeded', fix: 'Slow down request frequency; check Retry-After header' },
          { code: 'CERT_INVALID', cause: 'SSL certificate is self-signed or expired', fix: 'Disable SSL verification in Settings for dev servers' },
        ].map(({ code, cause, fix }) => (
          <div key={code} className="grid grid-cols-3 gap-2 p-3 rounded border border-border/20 text-xs">
            <InlineCode>{code}</InlineCode>
            <span className="text-muted-foreground">{cause}</span>
            <span className="text-muted-foreground">{fix}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SavedTestsSection() {
  return (
    <section>
      <SectionHeading>Saved Tests & History</SectionHeading>
      <Lead>TestForge keeps two separate local stores: request history (the last 30 requests) and saved test files (test code you have generated and chosen to keep).</Lead>

      <SubHeading>Saved Test Files</SubHeading>
      <P>After generating a test file, click <strong>Save to TestForge</strong> in the test generation modal to store it locally. Saved files appear in the <strong>Tests</strong> panel (accessible from the top navigation bar). Each saved file stores:</P>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>The generated test code</li>
        <li>The source request (URL, method) and response snapshot used for generation</li>
        <li>The selected framework</li>
        <li>Creation timestamp and last-edited timestamp</li>
      </ul>

      <SubHeading>Managing Saved Tests</SubHeading>
      <P>From the Tests panel you can: rename a file, re-open it in the editor for inline editing, re-generate it from the original request, download it, or delete it. Test files are stored in <InlineCode>localStorage</InlineCode> under <InlineCode>testforge:tests</InlineCode> with a cap of 50 files (roughly 10 MB).</P>

      <SubHeading>Exporting All Tests</SubHeading>
      <P>Click <strong>Export All Tests</strong> in the Tests panel to download a <InlineCode>.zip</InlineCode> archive of all saved test files, organised by collection. This is useful when migrating to a new machine or onboarding a teammate.</P>
    </section>
  );
}

function LocalAISection() {
  return (
    <section>
      <SectionHeading>Local AI Assistant</SectionHeading>
      <Lead>TestForge's AI features are designed to run on-device where possible, keeping your API payloads and credentials private by default.</Lead>

      <SubHeading>What the AI Does</SubHeading>
      <ul className="list-disc ml-5 space-y-1.5 text-sm text-muted-foreground mb-6">
        <li><strong className="dark:text-white text-black">Assertion suggestions</strong> — after a response loads, the AI suggests useful assertions based on the response shape</li>
        <li><strong className="dark:text-white text-black">Error explanation</strong> — translates cryptic error codes into plain-English explanations with fix suggestions</li>
        <li><strong className="dark:text-white text-black">Request body help</strong> — given an endpoint URL and response schema, suggests a valid request body for POST/PUT operations</li>
      </ul>

      <SubHeading>Local vs. Cloud Mode</SubHeading>
      <P>TestForge attempts to run AI features using a local model (via WebLLM or Ollama if installed). If a local model is unavailable, it falls back to a cloud endpoint. You can control this in <strong>Settings → AI Assistant</strong>:</P>
      <div className="space-y-2 mb-4">
        {[
          ['Local only', 'Never use cloud. AI features are disabled if no local model is available.'],
          ['Local preferred', '(Default) Use local model if available; fall back to cloud otherwise.'],
          ['Cloud only', 'Always use the cloud endpoint. Fastest and most capable.'],
          ['Disabled', 'Disable all AI features.'],
        ].map(([mode, desc]) => (
          <div key={mode as string} className="flex gap-3 text-sm p-3 rounded border border-border/20">
            <InlineCode>{mode as string}</InlineCode>
            <span className="text-xs text-muted-foreground self-center">{desc as string}</span>
          </div>
        ))}
      </div>

      <SubHeading>Privacy & Data Handling</SubHeading>
      <P>When using the cloud endpoint, TestForge sends only the minimum data needed for the AI task: the response body (up to 50 KB), the response status, and the endpoint path (host is stripped). No API keys, no full URLs, no request headers are sent to the AI service.</P>

      <Note>AI diagnostics in local mode requires at least 8 GB of RAM for a 7B parameter model. On lower-memory devices, use "Local preferred" mode and TestForge will use cloud when the device is under memory pressure.</Note>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section>
      <SectionHeading>Architecture & Tech Stack</SectionHeading>
      <Lead>TestForge is a Next.js application with a thin server-side proxy layer. Understanding the architecture helps when self-hosting or contributing.</Lead>

      <SubHeading>High-Level Architecture</SubHeading>
      <CodeBlock>{`Browser (Next.js App)
  │
  ├─ React UI (request builder, response inspector, history)
  ├─ localStorage (history, saved tests, environments)
  └─ fetch → POST /api/request
                │
                ▼
      Next.js API Route (server-side proxy)
                │
                ▼
      Target API (any HTTP/HTTPS endpoint)
                │
                ▼
      Response forwarded back to browser`}</CodeBlock>

      <SubHeading>Technology Stack</SubHeading>
      <div className="space-y-3 mb-6">
        {[
          { layer: 'Framework', tech: 'Next.js 14 (App Router)', why: 'Server components for the marketing pages, client components for the interactive inspector, API routes for the proxy.' },
          { layer: 'Language', tech: 'TypeScript 5', why: 'End-to-end type safety across the request/response pipeline.' },
          { layer: 'Styling', tech: 'Tailwind CSS v3', why: 'Design tokens via CSS variables; utility classes for layout and spacing.' },
          { layer: 'State', tech: 'React useState / useReducer + localStorage', why: 'No external state management library. All persistent state is serialised to localStorage.' },
          { layer: 'AI (cloud)', tech: 'Custom inference endpoint', why: 'Privacy-respecting cloud fallback for debugging help and error explanation.' },
          { layer: 'AI (local)', tech: 'WebLLM / Ollama integration', why: 'Runs a quantised LLM in-browser (WebLLM) or via a local Ollama server.' },
          { layer: 'Testing', tech: 'Vitest + Playwright', why: 'Unit tests for utility functions; end-to-end tests for the inspector workflow.' },
        ].map(({ layer, tech, why }) => (
          <div key={layer} className="p-4 rounded-lg border border-border/20">
            <div className="flex items-start gap-3 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20 shrink-0">{layer}</span>
              <InlineCode>{tech}</InlineCode>
            </div>
            <p className="text-xs text-muted-foreground ml-[5.5rem]">{why}</p>
          </div>
        ))}
      </div>

      <SubHeading>Self-Hosting</SubHeading>
      <P>TestForge can be self-hosted on any Node.js 20+ environment. The proxy API route requires outbound HTTP access. The AI cloud fallback can be disabled entirely for air-gapped deployments.</P>
      <CodeBlock>{`git clone https://github.com/testforge/testforge
cd testforge
npm install
cp .env.example .env.local   # configure as needed
npm run build
npm start`}</CodeBlock>
    </section>
  );
}

function ApiReferenceSection() {
  return (
    <section>
      <SectionHeading>API Reference</SectionHeading>
      <Lead>The TestForge backend exposes a single proxy endpoint. All other interactions happen client-side.</Lead>

      <SubHeading>POST /api/request</SubHeading>
      <P>Forwards an HTTP request to the specified URL and returns the response.</P>

      <H3>Request Body</H3>
      <CodeBlock>{`{
  "url":     "https://api.example.com/users",  // required
  "method":  "GET",                             // required: GET|POST|PUT|PATCH|DELETE
  "headers": {                                  // optional
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
  },
  "body":    "{\"name\":\"Jane\"}",             // optional, string
  "timeout": 15000,                             // optional, ms (default: 15000, max: 60000)
  "followRedirects": true,                      // optional (default: true)
  "verifySsl": true                             // optional (default: true)
}`}</CodeBlock>

      <H3>Response Body (success)</H3>
      <CodeBlock>{`{
  "status":      200,
  "statusText":  "OK",
  "headers": {
    "content-type": "application/json",
    "x-ratelimit-remaining": "99"
  },
  "body":        "{\"id\":42,\"name\":\"Jane\"}",
  "duration":    142,
  "size":        1024,
  "decodedSize": 4096
}`}</CodeBlock>

      <H3>Response Body (error)</H3>
      <CodeBlock>{`{
  "error": {
    "code":    "ECONNREFUSED",
    "message": "connect ECONNREFUSED 127.0.0.1:8080",
    "category": "NETWORK"
  }
}`}</CodeBlock>

      <H3>HTTP Status Codes Returned by the Proxy</H3>
      <div className="space-y-2 text-sm">
        {[
          ['200', 'Request forwarded successfully (even if the target returned 4xx/5xx — check response.status)'],
          ['400', 'Invalid request body (missing url or method)'],
          ['413', 'Request body exceeds 5 MB limit'],
          ['500', 'Internal proxy error'],
          ['504', 'Proxy timed out waiting for the target (distinct from target timeout)'],
        ].map(([code, desc]) => (
          <div key={code} className="flex gap-3">
            <Badge color={code === '200' ? 'green' : code === '400' || code === '413' ? 'yellow' : 'red'}>{code as string}</Badge>
            <span className="text-xs text-muted-foreground self-center">{desc as string}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    { q: 'Is my API data secure?', a: 'All requests are proxied through the TestForge server but are never logged or stored. Response data is stored locally in your browser\'s localStorage — it never leaves your machine. For maximum privacy, enable "Local only" AI mode in Settings.' },
    { q: 'Can I use TestForge with localhost APIs?', a: 'Yes. Because requests are forwarded by the server-side proxy, there are no browser CORS restrictions. Use http://localhost:PORT/path as your URL. The proxy must be able to reach the target — for Docker-based APIs, use the container\'s host IP rather than localhost.' },
    { q: 'How many requests are saved in history?', a: 'TestForge keeps the last 30 requests. When the limit is reached, the oldest non-starred entry is removed. Starred entries are never evicted. If you need persistent collections, use the Collections feature.' },
    { q: 'Can I test WebSocket or GraphQL APIs?', a: 'WebSocket support is on the roadmap. For GraphQL, use HTTP POST requests with a JSON body containing the "query" field — GraphQL over HTTP works perfectly with the standard inspector.' },
    { q: 'Why is my token being masked in history?', a: 'TestForge masks authorization header values in the history panel (showing only the first 8 characters) to prevent credential leakage if you share a screenshot of your history. The full value is used when replaying requests.' },
    { q: 'Can TestForge export to Postman / Insomnia format?', a: 'Collection export currently uses TestForge\'s own JSON format. Postman Collection v2.1 export is on the roadmap. In the meantime, the "Copy as cURL" feature works across most API tools.' },
    { q: 'What is the maximum response size?', a: 'Response bodies are capped at 10 MB. Bodies over 50 KB are truncated before being sent to the AI for diagnostics, though the full body is still shown in the inspector.' },
    { q: 'Does TestForge require an account or API key?', a: 'Core inspection features (request builder, response inspector, history) require no account. AI-powered diagnostics require an API key for the cloud fallback mode. Local AI mode has no such requirement.' },
  ];

  return (
    <section>
      <SectionHeading>Frequently Asked Questions</SectionHeading>
      <Lead>Answers to common questions about TestForge's behaviour, security, and capabilities.</Lead>

      <div className="space-y-5 mt-6">
        {faqs.map(({ q, a }) => (
          <div key={q} className="p-5 rounded-lg border border-border/20">
            <h3 className="text-sm font-semibold dark:text-white text-black mb-2">{q}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── section map ──────────────────────────────────────────────────────────────

const SECTIONS: Record<string, React.ReactNode> = {
  overview: <OverviewSection />,
  'quick-start': <QuickStartSection />,
  'interface-tour': <InterfaceTourSection />,
  'making-requests': <MakingRequestsSection />,
  'http-methods': <HttpMethodsSection />,
  authentication: <AuthenticationSection />,
  headers: <HeadersSection />,
  'history-replay': <HistoryReplaySection />,
  'response-inspector': <ResponseInspectorSection />,
  'error-handling': <ErrorHandlingSection />,
  'keyboard-shortcuts': <KeyboardShortcutsSection />,
  'assertions-overview': <AssertionsSection />,
  'collections-overview': <CollectionsSection />,
  'env-overview': <EnvVarsSection />,
  'debug-insights': <DebugInsightsSection />,
  'error-diagnostics': <ErrorDiagnosticsSection />,
  'saved-tests': <SavedTestsSection />,
  'local-ai': <LocalAISection />,
  architecture: <ArchitectureSection />,
  'api-reference': <ApiReferenceSection />,
  faq: <FaqSection />,
};

// ─── main page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(docSections.map(s => s.id))
  );
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const toggleSection = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    setActiveSection(id);
    if (sidebarRef.current) sidebarRef.current.scrollTop = 0;
  };

  useEffect(() => {
    // Desktop: scroll the fixed panel
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    // Mobile: scroll the actual window
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeSection]);

  return (
    // ↓ CHANGE 1: h-screen overflow-hidden → md:h-screen md:overflow-hidden
    <div className="bg-background text-foreground flex flex-col md:h-screen md:overflow-hidden">
      <Navbar showLaunchButton={false} />

      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center px-4 pt-3 pb-1">
        <button
          aria-label="Open docs navigation"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded bg-muted/30 hover:bg-muted/50 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-3 text-sm text-muted-foreground">
          {docSections.flatMap(s => s.subsections ?? []).find(s => s.id === activeSection)?.title ?? 'Docs'}
        </span>
      </div>

      {/* ↓ CHANGE 2: added flex-col md:flex-row so mobile stacks, desktop rows */}
      <div className="flex-1 flex flex-col md:flex-row w-full md:overflow-hidden">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — unchanged */}
        <aside
          ref={sidebarRef}
          className={[
            'border-r border-border/20 overflow-y-auto',
            'bg-background dark:bg-neutral-900',
            'transform transition-transform duration-200 ease-out',
            'fixed left-0 top-0 bottom-0 z-40 pt-14 w-64',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
            'md:translate-x-0 md:fixed md:left-0 md:top-[56px] md:bottom-0 md:pt-0 md:w-64 md:z-20',
          ].join(' ')}
        >
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/20">
            <span className="text-sm font-semibold">Docs</span>
            <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-muted/50 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 pt-3 pb-6 space-y-0.5">
            {docSections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted/50 transition text-sm font-medium dark:text-white text-black cursor-pointer"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded.has(section.id) ? 'rotate-0' : '-rotate-90'}`}
                  />
                  {section.title}
                </button>

                {expanded.has(section.id) && section.subsections && (
                  <div className="ml-4 space-y-0.5 pb-1">
                    {section.subsections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.id)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition cursor-pointer ${
                          activeSection === sub.id
                            ? 'bg-primary text-white font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ↓ CHANGE 3: overflow-y-auto → md:overflow-y-auto (mobile scrolls window, not this div) */}
        <main ref={mainRef} className="flex-1 min-w-0 md:ml-64 md:overflow-y-auto px-5 sm:px-10 py-8">
          <div className="max-w-none pr-6">
            {SECTIONS[activeSection] ?? (
              <p className="text-muted-foreground">Section not found.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}