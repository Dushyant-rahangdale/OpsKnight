# Fixing OneDrive EBUSY Errors

## Problem
Next.js is encountering `EBUSY: resource busy or locked` errors when trying to access files in the `.next` directory. This is common when the project is in a OneDrive synced folder.

## Quick Fix

### Option 1: Use the Clear Cache Script (Easiest)
1. **Stop the dev server** (press `Ctrl+C` in the terminal running `npm run dev`)
2. Run the clear cache script:
   ```powershell
   .\clear-cache.ps1
   ```
3. Restart the dev server:
   ```powershell
   npm run dev
   ```

### Option 2: Manual Clear
1. **Stop the dev server** (press `Ctrl+C`)
2. Delete the `.next` folder manually or run:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. Restart the dev server:
   ```powershell
   npm run dev
   ```

## Permanent Solutions

### Option 1: Exclude .next from OneDrive Sync (Recommended)
1. Right-click on the `.next` folder in File Explorer
2. Select **OneDrive** → **Always keep on this device**
3. Or exclude it from sync:
   - Right-click OneDrive icon in system tray
   - **Settings** → **Sync and backup** → **Advanced settings**
   - Add `.next` to exclusion list

### Option 2: Move Project Outside OneDrive
Move the project to a location outside OneDrive:
- Example: `C:\dev\OpsGuard` or `D:\Projects\OpsGuard`

### Option 3: Configure OneDrive to Not Sync .next
The `.next` folder is already in `.gitignore`, but OneDrive might still try to sync it. You can:
1. Create a `.onedriveignore` file (if supported)
2. Or use OneDrive's "Free up space" feature on the `.next` folder

## Why This Happens
- OneDrive sync locks files while syncing
- Windows file system locks files during read/write operations
- Multiple processes trying to access the same file simultaneously

## Prevention
- Keep the dev server running in a single terminal
- Don't open `.next` folder in File Explorer while dev server is running
- Consider moving the project outside OneDrive for development
