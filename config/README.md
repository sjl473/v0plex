# Site Configuration

## Changing the URL Prefix

To change the URL prefix for all markdown pages throughout the application, edit **ONE LINE** in `config/site.config.ts`:

```typescript
// Change this value to update ALL URLs throughout the app
export const URL_PREFIX = 'page'; // ← Change 'page' to 'out' or any other path
```

### Example: Change from `/page` to `/out`

**Before:**
```typescript
export const URL_PREFIX = 'page';
```

**After:**
```typescript
export const URL_PREFIX = 'out';
```

### What Gets Updated

When you change `URL_PREFIX`, it automatically updates:

1. **Frontend URLs:**
   - Sidebar navigation links: `/page/article` → `/out/article`
   - Search result links: `/page/...` → `/out/...`
   - Page navigation (prev/next): `/page/...` → `/out/...`

2. **Backend:**
   - Generated files directory: `app/page/` → `app/out/`
   - Edit URLs in page components
   - Config exclusions

### Steps to Change URL Prefix

1. **Edit the config:**
   ```bash
   # Edit config/site.config.ts
   # Change: export const URL_PREFIX = 'page';
   # To:     export const URL_PREFIX = 'out';
   ```

2. **Rename the directory:**
   ```bash
   mv app/page app/out
   ```

3. **Update .gitignore:**
   ```bash
   # Change: app/page/
   # To:     app/out/
   ```

4. **Regenerate pages:**
   ```bash
   npm run vmd:gen
   ```

5. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Files That Use This Config

- `config/site.config.ts` - **SOURCE OF TRUTH** (edit this!)
- `vmd_parser/config.ts` - Imports from site.config.ts
- `components/common/sidebar.tsx` - Uses `SITE_CONFIG.URL_PREFIX`
- `components/common/page-navigation.tsx` - Uses `SITE_CONFIG.URL_PREFIX`
- `vmd_parser/builder/file_processor.ts` - Uses `CONFIG.URL_PREFIX`

### Important Notes

⚠️ **Only edit `config/site.config.ts`** - all other files import from there.

⚠️ **After changing the URL prefix:**
- Rename the directory: `app/[old-prefix]` → `app/[new-prefix]`
- Update `.gitignore` to exclude the new directory
- Regenerate all markdown pages

✅ **No need to edit** individual component files - they all use the config!
