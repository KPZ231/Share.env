import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Env file contents/tokens must never be embedded elsewhere.
          // Security note: 'unsafe-eval' below is a CSP directive string, not
          // a call to the eval() function. It's gated to development only 
          // React's dev-mode debugging calls eval() to reconstruct callstacks
          // (never in production builds), so production keeps the strict CSP
          // with no 'unsafe-eval', which is what actually matters for XSS risk.
          {
            key: "Content-Security-Policy",
            value:
              process.env.NODE_ENV === "development"
                ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:8400; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co http://localhost:8400; frame-ancestors 'none';"
                : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
