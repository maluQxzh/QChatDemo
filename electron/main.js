
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dns = require('dns');

// Global reference to prevent garbage collection
let mainWindow;

// Storage references
let StoreClass;
let globalStore; // For app-wide settings (e.g. who is logged in currently)
let userStore;   // For specific user data (messages, contacts)

// 1. Native check for Dev environment
const isDev = !app.isPackaged;

async function initialize() {
  try {
    // 2. Dynamic Import for ESM-only packages
    const { default: Store } = await import('electron-store');
    StoreClass = Store;
    
    // Initialize Global Store (config.json)
    globalStore = new Store({ name: isDev ? 'config-dev' : 'config' });
    
    createWindow();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev, 
    },
    titleBarStyle: 'hiddenInset', 
    autoHideMenuBar: true, 
    show: false, 
    backgroundColor: '#f8fafc',
    title: `QChat${isDev ? ' (DEV)' : ''}`
  });

  const startURL = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// App Lifecycle
app.whenReady().then(initialize);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers (Backend Logic) ---

// Auth: Switch Storage File
ipcMain.handle('auth:login', (event, userId) => {
    if (!StoreClass || !userId) return false;
    
    // Switch to user-specific file: e.g., "user_user_001.json"
    // Using a clean filename
    const safeId = userId.replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `user_${safeId}${isDev ? '_dev' : ''}`;
    
    console.log(`[Main] Switching storage to: ${fileName}`);
    userStore = new StoreClass({ name: fileName });
    return true;
});

ipcMain.handle('auth:logout', () => {
    console.log('[Main] Logging out, clearing user store reference');
    userStore = null;
    return true;
});

// Get Data
ipcMain.handle('db:get', (event, key) => {
  // Special keys that always live in Global Store
  if (key === 'orbit_current_user') {
      return globalStore ? globalStore.get(key) : null;
  }
  
  // Per-user keys
  if (userStore) {
      return userStore.get(key);
  }
  
  // Fallback (e.g. before login)
  return globalStore ? globalStore.get(key) : null;
});

// Set Data
ipcMain.handle('db:set', (event, { key, value }) => {
  if (key === 'orbit_current_user') {
      if (globalStore) globalStore.set(key, value);
      return true;
  }

  if (userStore) {
      userStore.set(key, value);
      return true;
  }
  
  if (globalStore) {
      globalStore.set(key, value);
      return true;
  }
  return false;
});

// Clear Data
ipcMain.handle('db:clear', () => {
  if (userStore) userStore.clear();
  // We generally don't clear global store on user reset, but let's clear userStore
  return true;
});

// Quit App
ipcMain.handle('app:quit', () => {
    app.quit();
});

// DNS Resolution
ipcMain.handle('net:resolve-dns', async (event, hostname) => {
    return new Promise((resolve) => {
        dns.lookup(hostname, { family: 4 }, (err, address) => {
            if (err) {
                console.error(`[Main] DNS lookup failed for ${hostname}:`, err);
                resolve(null);
            } else {
                console.log(`[Main] DNS resolved ${hostname} -> ${address}`);
                resolve(address);
            }
        });
    });
});
