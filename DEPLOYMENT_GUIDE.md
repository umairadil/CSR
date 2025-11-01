# 🚀 Production Deployment Guide for SmartASP

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Build Process](#build-process)
5. [Upload to SmartASP](#upload-to-smartasp)
6. [SmartASP Configuration](#smartasp-configuration)
7. [Post-Deployment Testing](#post-deployment-testing)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ **SmartASP Hosting Account** with Node.js support
- ✅ **SQL Server Database** credentials from SmartASP
- ✅ **Domain/Subdomain** configured
- ✅ **Node.js v18+** installed on SmartASP
- ✅ **FTP/SFTP credentials** for file upload
- ✅ **Production environment variables** ready

---

## Environment Configuration

### 1. Create Production `.env` File

Create a `.env.production` file with your SmartASP production settings:

```env
# Database Configuration (SQL Server from SmartASP)
DATABASE_URL="sqlserver://YOUR_SMARTASP_SQL_HOST:1433;database=YOUR_DB_NAME;user=YOUR_DB_USER;password=YOUR_DB_PASSWORD;encrypt=true;trustServerCertificate=true"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.smartasp.net"
NEXTAUTH_SECRET="YOUR_PRODUCTION_SECRET_KEY_HERE_GENERATE_NEW_ONE"

# Node Environment
NODE_ENV="production"

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Socket.IO Configuration
SOCKET_PORT=3000
SOCKET_PATH="/socket.io"
```

**Important Notes:**
- Replace `YOUR_SMARTASP_SQL_HOST` with the SQL Server host provided by SmartASP
- Replace `YOUR_DB_NAME`, `YOUR_DB_USER`, `YOUR_DB_PASSWORD` with actual credentials
- Generate a new `NEXTAUTH_SECRET` for production: Run `openssl rand -base64 32` or use an online generator
- Update `NEXTAUTH_URL` with your actual production domain

---

## Database Setup

### 1. Run Prisma Migrations on Production Database

```bash
# Set the production DATABASE_URL
$env:DATABASE_URL="sqlserver://YOUR_SMARTASP_SQL_HOST:1433;database=YOUR_DB_NAME;user=YOUR_DB_USER;password=YOUR_DB_PASSWORD;encrypt=true;trustServerCertificate=true"

# Push the schema to production
npx prisma db push

# (Optional) Seed the database with initial data
npx prisma db seed
```

### 2. Verify Database Connection

```bash
npx prisma studio
```

Open `http://localhost:5555` to verify all tables are created correctly.

---

## Build Process

### 1. Install Production Dependencies

```bash
npm ci --production=false
```

### 2. Build the Next.js Application

```bash
npm run build
```

This will create an optimized production build in the `.next` folder.

### 3. Test Build Locally (Optional)

```bash
# Use production environment variables
$env:NODE_ENV="production"
npm start
```

Visit `http://localhost:3000` to test the production build locally.

---

## Upload to SmartASP

### Files/Folders to Upload

Upload the following to your SmartASP hosting via FTP/SFTP:

```
✅ .next/               (production build)
✅ node_modules/        (all dependencies)
✅ public/              (static assets)
✅ prisma/              (schema and migrations)
✅ uploads/             (create empty folder)
✅ server.js            (custom server with Socket.IO)
✅ package.json
✅ package-lock.json
✅ .env.production      (rename to .env on server)
✅ next.config.js
```

### Files/Folders to EXCLUDE

```
❌ .git/
❌ .next/cache/
❌ .env.local
❌ .env.development
❌ README.md
❌ DEPLOYMENT_GUIDE.md
❌ node_modules/ (if installing on server)
```

### FTP Upload Steps

1. **Connect to SmartASP FTP**
   - Host: `ftp.your-domain.smartasp.net`
   - Username: Your SmartASP FTP username
   - Password: Your SmartASP FTP password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Navigate to Application Root**
   - Usually: `/httpdocs` or `/public_html`

3. **Upload Files**
   - Upload all files listed above
   - Ensure folder structure is maintained
   - This may take 15-30 minutes depending on connection speed

---

## SmartASP Configuration

### 1. Install Node.js Dependencies (on Server)

If SmartASP provides SSH access:

```bash
# SSH into your SmartASP server
ssh your-username@your-domain.smartasp.net

# Navigate to application directory
cd /path/to/your/app

# Install dependencies
npm ci --production

# Run Prisma migrations
npx prisma generate
npx prisma db push
```

### 2. Configure Application Startup

Create a startup script `start.sh`:

```bash
#!/bin/bash
export NODE_ENV=production
export PORT=3000
node server.js
```

Make it executable:

```bash
chmod +x start.sh
```

### 3. SmartASP Application Pool Settings

In SmartASP Control Panel:

1. **Go to Application Pool Settings**
2. **Set Node.js Version**: v18 or higher
3. **Set Entry Point**: `server.js` or `start.sh`
4. **Set Environment Variables** (from `.env.production`)
5. **Enable Always On** (if available)
6. **Set Memory Limit**: At least 512MB (recommended: 1GB)

### 4. Configure Web.config (IIS)

If SmartASP uses IIS, create/update `web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}" />
        </rule>
        
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    
    <iisnode 
      node_env="production"
      nodeProcessCommandLine="node"
      loggingEnabled="true"
      devErrorsEnabled="false"
      debuggingEnabled="false"
      watchedFiles="*.js;iisnode.yml"
    />
    
    <webSocket enabled="true" />
    
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### 5. Start the Application

```bash
# If using SSH
./start.sh

# Or let SmartASP's Application Pool manage it
# Restart the application pool from SmartASP control panel
```

---

## Post-Deployment Testing

### 1. Test Basic Functionality

- ✅ Visit homepage: `https://your-domain.smartasp.net`
- ✅ Test login: `https://your-domain.smartasp.net/auth/signin`
- ✅ Test admin dashboard: `https://your-domain.smartasp.net/admin`
- ✅ Test agent dashboard: `https://your-domain.smartasp.net/agent`

### 2. Test Real-Time Features

- ✅ **Socket.IO Connection**: Check browser console for "✅ Connected to orders namespace"
- ✅ **Order Grid Updates**: Verify grid updates in real-time
- ✅ **Agent Status**: Verify online/offline status updates
- ✅ **Chat Functionality**: Send messages between users

### 3. Test Chat Features

- ✅ Open chat widget on admin dashboard
- ✅ Send message to an agent
- ✅ Verify real-time message delivery
- ✅ Test file attachments
- ✅ Test emoji picker

### 4. Performance Testing

- ✅ Page load times (should be < 3 seconds)
- ✅ Socket reconnection on network interruption
- ✅ Grid performance with large datasets
- ✅ Memory usage monitoring

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **Socket.IO Not Connecting**

**Symptoms**: Chat shows "Disconnected", grid shows "Connecting..."

**Solutions**:
```javascript
// In server.js, ensure CORS is properly configured for production
const io = new Server(server, {
  cors: {
    origin: ["https://your-domain.smartasp.net"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});
```

#### 2. **Database Connection Failed**

**Symptoms**: 500 errors, "Can't reach database server" errors

**Solutions**:
- Verify SQL Server is running on SmartASP
- Check firewall rules allow connection
- Ensure `trustServerCertificate=true` in connection string
- Verify credentials are correct

```bash
# Test connection
npx prisma db pull
```

#### 3. **Application Not Starting**

**Symptoms**: Site shows error or doesn't load

**Solutions**:
- Check SmartASP error logs
- Verify Node.js version is v18+
- Ensure all dependencies are installed
- Check `NODE_ENV=production` is set
- Verify `PORT` environment variable

#### 4. **Static Files Not Loading**

**Symptoms**: CSS/JS files return 404 errors

**Solutions**:
- Ensure `public/` folder is uploaded
- Verify `.next/static/` folder exists
- Check `next.config.js` is uploaded
- Restart application pool

#### 5. **Session/Auth Issues**

**Symptoms**: Can't log in, session not persisting

**Solutions**:
- Verify `NEXTAUTH_URL` matches your domain exactly
- Ensure `NEXTAUTH_SECRET` is set and unique
- Check cookies are allowed in browser
- Verify HTTPS is enabled (required for NextAuth)

---

## Monitoring & Maintenance

### 1. Setup Logging

Enable application logs in SmartASP:

```javascript
// In server.js, add file logging
const fs = require('fs');
const logStream = fs.createWriteStream('./logs/app.log', { flags: 'a' });

console.log = function(msg) {
  logStream.write(`${new Date().toISOString()} - ${msg}\n`);
};
```

### 2. Monitor Application

- Check SmartASP control panel for memory/CPU usage
- Monitor error logs regularly
- Setup uptime monitoring (e.g., UptimeRobot)
- Monitor database size and performance

### 3. Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review and clean database
- **Quarterly**: Update dependencies (`npm update`)
- **As Needed**: Scale resources based on traffic

---

## Scaling Considerations

As your application grows, consider:

1. **Database Optimization**
   - Add indexes to frequently queried fields
   - Implement caching (Redis)
   - Database read replicas

2. **Load Balancing**
   - Multiple Node.js instances
   - Socket.IO sticky sessions
   - CDN for static assets

3. **Monitoring Tools**
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Analytics dashboard

---

## Security Checklist

Before going live:

- ✅ Change all default passwords
- ✅ Use strong `NEXTAUTH_SECRET`
- ✅ Enable HTTPS/SSL
- ✅ Configure CORS properly
- ✅ Implement rate limiting
- ✅ Keep dependencies updated
- ✅ Backup database regularly
- ✅ Use environment variables (never hardcode secrets)

---

## Support

For SmartASP-specific issues:
- **SmartASP Support**: support@smartasp.net
- **Documentation**: https://smartasp.net/docs

For application issues:
- Check application logs
- Review this deployment guide
- Contact development team

---

## Quick Reference Commands

```bash
# Build application
npm run build

# Test production build locally
npm start

# Database migrations
npx prisma db push
npx prisma generate

# Install dependencies
npm ci --production

# Start application
node server.js
```

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
**Author**: Development Team

---

Good luck with your deployment! 🚀



