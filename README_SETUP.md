# Retail Inventory Agent - Setup Guide

This application can be set up in two ways. **Docker is strongly recommended** as it is the simplest and most reliable method.

## Option 1: Docker (Easiest - Recommended)
If you have Docker Desktop installed, this is the best path.

1.  Open Docker Desktop.
2.  Run `start.bat`.
3.  Wait for the process to finish. The app will open automatically at `http://localhost:3000`.

## Option 2: Native Setup (Manual)
Use this if you cannot use Docker.

1.  Run `setup_native.bat`.
2.  The script will attempt to install Python and Node.js automatically.
3.  **If a certificate error occurs** (common on new laptops), the script will now attempt a direct download fallback.
4.  Once setup is complete, run `start_native.bat`.

---
**Note:** If `setup_native.bat` still fails, please install [Node.js LTS](https://nodejs.org/) manually from their website.
