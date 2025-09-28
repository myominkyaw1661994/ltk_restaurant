# Next.js Standalone Deployment to cPanel

This guide will help you deploy your Next.js application to cPanel using the standalone build.

## Prerequisites

1. cPanel hosting with Node.js support
2. Access to Terminal/SSH in cPanel
3. Your Next.js app built in standalone mode

## Step 1: Build the Application

Your app is already configured for standalone mode in `next.config.mjs`:
```javascript
const nextConfig = {
  output: 'standalone',
  // ... other config
};
```

Build the application:
```bash
npm run build
```

## Step 2: Prepare Files for Upload

The standalone build creates a `.next/standalone` directory with everything needed to run your app.

### Files to upload to cPanel:

1. **From `.next/standalone/` directory:**
   - `server.js` (main server file)
   - `package.json` (dependencies)
   - `node_modules/` (all dependencies)

2. **From `.next/` directory:**
   - Entire `.next/` directory (required for standalone mode)
   - This includes all build files and static assets

3. **Additional files:**
   - `.htaccess` (for proper routing)
   - `start.sh` (startup script)

## Step 3: Upload to cPanel

1. **Upload the standalone files:**
   - Upload the entire contents of `.next/standalone/` to your cPanel's `public_html` directory
   - Upload the entire `.next/` directory to your cPanel's `public_html` directory

2. **Set proper permissions:**
   ```bash
   chmod +x start.sh
   chmod 755 server.js
   ```

## Step 4: Configure Environment Variables

In cPanel, set up your environment variables:
- Database connection details
- JWT secrets
- Any other environment variables your app needs

## Step 5: Start the Application

Run the startup script:
```bash
./start.sh
```

Or manually start:
```bash
node server.js
```

## Step 6: Configure Domain/Subdomain

1. Point your domain to the directory containing `server.js`
2. Ensure the `.htaccess` file is in place for proper routing

## Troubleshooting

### Common Issues:

1. **Port conflicts:** Make sure the port (default 3000) is available
2. **Node.js version:** Ensure your hosting supports the Node.js version your app requires
3. **Memory limits:** Some shared hosting has memory limits that might affect your app
4. **Database connections:** Ensure your database credentials are correct

### Checking if the app is running:

```bash
# Check if the process is running
ps aux | grep node

# Check if the port is listening
netstat -tlnp | grep :3000
```

## File Structure on cPanel

```
public_html/
├── server.js
├── package.json
├── node_modules/
├── .htaccess
├── start.sh
└── .next/
    ├── server/
    ├── static/
    └── (all build files)
```

## Notes

- The standalone build includes all dependencies, so you don't need to run `npm install` on the server
- Make sure your hosting provider supports Node.js applications
- Consider using PM2 for process management in production
- Monitor your application logs for any issues
