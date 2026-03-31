# assets/

Drop any static assets here and reference them in HTML or CSS.

## Suggested files

| File | Used for |
|---|---|
| `favicon.ico` | Browser tab icon |
| `favicon.svg` | SVG favicon (modern browsers) |
| `logo.svg` | Site logo in the header |
| `medal-gold.svg` | Rank #1 icon in podium |
| `medal-silver.svg` | Rank #2 icon |
| `medal-bronze.svg` | Rank #3 icon |
| `flag-fallback.svg` | Shown when a country flag emoji is unavailable |

## How to reference in code

```html
<!-- In index.html -->
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<img src="assets/logo.svg" alt="World Athletics" class="logo">
```

```css
/* In css/style.css */
.medal-icon {
  background-image: url('../assets/medal-gold.svg');
}
```

```javascript
// In js/podium.js — swap emoji for an image if asset exists
const medalSrc = rank === 1 ? 'assets/medal-gold.svg'
               : rank === 2 ? 'assets/medal-silver.svg'
               : rank === 3 ? 'assets/medal-bronze.svg'
               : null;
```
