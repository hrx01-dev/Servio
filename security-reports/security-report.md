# 🛡️ Repository Security Audit Report

**Timestamp:** 2026-08-11T20:36:38.681Z  
**Overall Status:** ❌ **FAIL**  

## 📊 Executive Summary

| Category | Critical | High | Moderate | Low | Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dependencies (npm audit)** | 1 | 12 | 12 | 1 | 26 |
| **Secret Scanning** | 0 | 0 | 0 | 0 | 0 |
| **Static Code Analysis (SAST)** | 0 | 0 | 0 | 7 | 7 |
| **Configuration Checks** | 0 | 0 | 0 | 0 | 0 |

---

## 📦 1. Dependency Vulnerabilities

Found **26** vulnerabilities in dependencies.

| Package | Severity | Via / Advisory | Fix Available |
| :--- | :---: | :--- | :---: |
| `@google-cloud/storage` | **MODERATE** | retry-request, teeny-request | ✅ Yes |
| `@vercel/build-utils` | **HIGH** | @vercel/python-analysis | ✅ Yes |
| `@vercel/node` | **HIGH** | @vercel/build-utils, @vercel/static-config, path-to-regexp, undici | ✅ Yes |
| `@vercel/python-analysis` | **HIGH** | js-yaml, minimatch, smol-toml | ✅ Yes |
| `@vercel/static-config` | **MODERATE** | ajv | ✅ Yes |
| `ajv` | **MODERATE** | ajv has ReDoS when using `$data` option | ✅ Yes |
| `brace-expansion` | **HIGH** | brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups, brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups, brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups, brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash, brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash, brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash, brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation, brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation, brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation | ✅ Yes |
| `fast-xml-parser` | **HIGH** | fast-xml-parser: Repeated DOCTYPE declarations reset entity expansion limits | ✅ Yes |
| `firebase-admin` | **MODERATE** | @google-cloud/storage | ✅ Yes |
| `gaxios` | **MODERATE** | uuid | ✅ Yes |
| `js-yaml` | **HIGH** | JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases, js-yaml: YAML merge-key chains can force quadratic CPU consumption, JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported | ✅ Yes |
| `minimatch` | **HIGH** | minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern, minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments, minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions | ✅ Yes |
| `nanoid` | **HIGH** | nanoid: non-secure generators can loop indefinitely with negative size, nanoid: custom generators can loop indefinitely when size is zero | ✅ Yes |
| `path-to-regexp` | **HIGH** | path-to-regexp outputs backtracking regular expressions | ✅ Yes |
| `postcss` | **HIGH** | PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to Arbitrary .map File Disclosure, PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset | ✅ Yes |
| `protobufjs` | **MODERATE** | protobufjs: Denial of Service via infinite loop in .proto option parsing | ✅ Yes |
| `react-router` | **MODERATE** | React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass), React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration | ✅ Yes |
| `react-router-dom` | **MODERATE** | React Router: Open redirect leading to XSS, react-router | ✅ Yes |
| `retry-request` | **MODERATE** | teeny-request | ✅ Yes |
| `smol-toml` | **MODERATE** | smol-toml: Denial of Service via TOML documents containing thousands of consecutive commented lines | ✅ Yes |
| `tar` | **CRITICAL** | node-tar: Process crash via PAX numeric path type confusion, node-tar: Decompression/parse DoS via unlimited input, node-tar: Negative tar entry size causes infinite loop in archive replace, node-tar: Uncaught Exception DoS via NUL byte in PAX path/linkpath records, node-tar: Uncontrolled recursion in mapHas/filesFilter allows uncatchable stack-overflow DoS via crafted long-path tar with member selection | ✅ Yes |
| `teeny-request` | **MODERATE** | uuid | ✅ Yes |
| `undici` | **HIGH** | Use of Insufficiently Random Values in undici, Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion, undici Denial of Service attack via bad certificate data, Undici has an HTTP Request/Response Smuggling issue, Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression, Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation, Undici has CRLF Injection in undici via `upgrade` option, undici vulnerable to HTTP header injection via Set-Cookie percent-decoding, undici WebSocket client vulnerable to denial of service via fragment count bypass, undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching, undici vulnerable to downstream response desynchronization via retry interceptor, undici vulnerable to downstream response desynchronization via retry interceptor, undici vulnerable to cross-user information disclosure and parse-time crash via degenerate private cache directives, undici vulnerable to CRLF Injection via blob-like body 'type' property, undici vulnerable to CRLF Injection via blob-like body 'type' property, undici vulnerable to cross-user information disclosure via whitespace around equals in Cache-Control directives, undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields, undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields, undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse | ✅ Yes |
| `uuid` | **MODERATE** | uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided | ✅ Yes |
| `vite` | **HIGH** | Vite middleware may serve files starting with the same name with the public directory, Vite's `server.fs` settings were not applied to HTML files, vite allows server.fs.deny bypass via backslash on Windows, Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling, Vite Vulnerable to Arbitrary File Read via Vite Dev Server WebSocket, launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows, vite: `server.fs.deny` bypass on Windows alternate paths | ✅ Yes |

## 🔑 2. Secret & Credential Scanning

✅ No exposed secrets or hardcoded credentials detected.

## 🔬 3. Static Code Analysis (SAST)

Found **7** code pattern notices:

| File | Line | Pattern | Severity | Description |
| :--- | :---: | :--- | :---: | :--- |
| [scripts/generate-icons.mjs](file:///scripts/generate-icons.mjs#L184) | 184 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |
| [src/app/components/Aurora.tsx](file:///src/app/components/Aurora.tsx#L10) | 10 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |
| [src/app/components/Portfolio.tsx](file:///src/app/components/Portfolio.tsx#L248) | 248 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |
| [src/app/components/Pricing.tsx](file:///src/app/components/Pricing.tsx#L232) | 232 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |
| [src/app/components/Services.tsx](file:///src/app/components/Services.tsx#L24) | 24 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |
| [src/app/components/SplashScreen.tsx](file:///src/app/components/SplashScreen.tsx#L28) | 28 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |
| [src/app/components/WhyChoose.tsx](file:///src/app/components/WhyChoose.tsx#L29) | 29 | **Insecure HTTP URL** | LOW | Insecure HTTP endpoint detected; prefer HTTPS for external network calls. |

## ⚙️ 4. Configuration Checks

✅ All security configurations passed checks.

---
*Generated automatically by Servio Security Automation.* 
