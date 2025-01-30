const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let mainWindow;
let db;
const dbPath = path.join(__dirname, 'wrestlers.db');

// Initialize IPC handlers
function initializeIpcHandlers() {
    // Remove any existing handlers
    ipcMain.removeHandler('get-wrestler-types');
    ipcMain.removeHandler('get-weight-classes');
    ipcMain.removeHandler('get-factions');
    ipcMain.removeHandler('get-brands');
    ipcMain.removeHandler('add-wrestler');
    ipcMain.removeHandler('get-wrestlers');
    ipcMain.removeHandler('get-all-wrestlers');

    // Register handlers
    ipcMain.handle('get-wrestler-types', async () => {
        return new Promise((resolve, reject) => {
            console.log('Fetching wrestler types...');
            db.all('SELECT * FROM wrestler_types ORDER BY type_name', [], (err, rows) => {
                if (err) {
                    console.error('Error fetching wrestler types:', err);
                    reject(err);
                    return;
                }
                console.log('Fetched wrestler types:', rows);
                resolve(rows);
            });
        });
    });


    ipcMain.handle('get-factions', async () => {
        return new Promise((resolve, reject) => {
            console.log('Fetching factions...');
            db.all('SELECT * FROM factions ORDER BY name', [], (err, rows) => {
                if (err) {
                    console.error('Error fetching factions:', err);
                    reject(err);
                    return;
                }
                console.log('Fetched factions:', rows);
                resolve(rows);
            });
        });
    });

    ipcMain.handle('get-brands', async () => {
        return new Promise((resolve, reject) => {
            console.log('Fetching brands...');
            db.all('SELECT * FROM brands ORDER BY name', [], (err, rows) => {
                if (err) {
                    console.error('Error fetching brands:', err);
                    reject(err);
                    return;
                }
                console.log('Fetched brands:', rows);
                resolve(rows);
            });
        });
    });

    ipcMain.handle('add-wrestler', async (event, wrestler) => {
        return new Promise((resolve, reject) => {
            console.log('Adding wrestler:', wrestler);
            
            const stmt = db.prepare(`
                INSERT INTO wrestlers (
                    name, brand_id, faction_id, type_id, weight_class_id, 
                    alignment, is_champion, is_in_faction
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                wrestler.name,
                wrestler.brand_id,
                wrestler.faction_id,
                wrestler.type,
                wrestler.weight_class,
                wrestler.alignment,
                wrestler.is_champion,
                wrestler.is_in_faction
            ], function(err) {
                if (err) {
                    console.error('Error adding wrestler:', err);
                    reject(err);
                    return;
                }
                console.log('Wrestler added successfully, id:', this.lastID);
                resolve({ id: this.lastID });
            });
        });
    });

    ipcMain.handle('get-wrestlers', async () => {
        return new Promise((resolve, reject) => {
            console.log('Fetching wrestlers...');
            const query = `
                SELECT w.*, b.name as brand_name, f.name as faction_name
                FROM wrestlers w
                LEFT JOIN brands b ON w.brand_id = b.id
                LEFT JOIN factions f ON w.faction_id = f.id
                ORDER BY w.name
            `;
            console.log('Executing query:', query);
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching wrestlers:', err);
                    reject(err);
                    return;
                }
                console.log('Fetched wrestlers:', rows);
                resolve(rows || []);
            });
        });
    });

    ipcMain.handle('get-all-wrestlers', async () => {
        try {
            console.log('Fetching all wrestlers...');
            const rows = await db.all('SELECT * FROM wrestlers ORDER BY name');
            console.log('Fetched all wrestlers:', rows);
            return rows;
        } catch (error) {
            console.error('Error getting all wrestlers:', error);
            throw error;
        }
    });

    ipcMain.handle('update-wrestler', async (event, wrestler) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                UPDATE wrestlers SET 
                    name = ?, 
                    brand_id = ?, 
                    faction_id = ?, 
                    type = ?, 
                    weight_class = ?, 
                    alignment = ?,
                    is_champion = ?,
                    is_in_faction = ?
                WHERE id = ?
            `);
            
            stmt.run([
                wrestler.name,
                wrestler.brand_id,
                wrestler.faction_id,
                wrestler.type,
                wrestler.weight_class,
                wrestler.alignment,
                wrestler.is_champion ? 1 : 0,
                wrestler.is_in_faction ? 1 : 0,
                wrestler.id
            ], function(err) {
                if (err) {
                    console.error('Error updating wrestler:', err);
                    reject(err);
                } else {
                    console.log('Updated wrestler:', wrestler.id);
                    resolve(this.changes);
                }
            });
        });
    });

    ipcMain.handle('get-wrestler', async (event, id) => {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT w.*, b.name as brand_name, f.name as faction_name
                FROM wrestlers w
                LEFT JOIN brands b ON w.brand_id = b.id
                LEFT JOIN factions f ON w.faction_id = f.id
                WHERE w.id = ?
            `, [id], (err, row) => {
                if (err) {
                    console.error('Error fetching wrestler:', err);
                    reject(err);
                } else {
                    console.log('Fetched wrestler:', row);
                    resolve(row);
                }
            });
        });
    });

    ipcMain.handle('get-shows', async () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM shows ORDER BY show_name', (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    });

    ipcMain.handle('add-show', async (event, show) => {
      return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO shows (show_name) VALUES (?)');
        stmt.run([show.show_name], function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        });
      });
    });

    ipcMain.handle('delete-show', async (event, id) => {
      return new Promise((resolve, reject) => {
        // First check if any wrestlers are using this show
        db.get('SELECT COUNT(*) as count FROM wrestlers WHERE brand = (SELECT show_name FROM shows WHERE id = ?)', [id], (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row.count > 0) {
            reject(new Error('Cannot delete show while wrestlers are assigned to it'));
            return;
          }
          
          // If no wrestlers are using it, delete the show
          const stmt = db.prepare('DELETE FROM shows WHERE id = ?');
          stmt.run([id], function(err) {
            if (err) reject(err);
            resolve(this.changes);
          });
        });
      });
    });

    ipcMain.handle('get-weight-classes', async () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM weight_classes ORDER BY id', (err, rows) => {
          if (err) {
            console.error('Error fetching weight classes:', err);
            reject(err);
          }
          console.log('Weight classes from DB:', rows);
          resolve(rows);
        });
      });
    });

    ipcMain.handle('add-wrestler-type', async (event, type) => {
      return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO wrestler_types (type_name) VALUES (?)');
        stmt.run([type.type_name], function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        });
      });
    });

    ipcMain.handle('delete-wrestler-type', async (event, id) => {
      return new Promise((resolve, reject) => {
        // Check if any wrestlers are using this type
        db.get('SELECT COUNT(*) as count FROM wrestlers WHERE wrestler_type_id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row.count > 0) {
            reject(new Error('Cannot delete type while wrestlers are using it'));
            return;
          }
          
          const stmt = db.prepare('DELETE FROM wrestler_types WHERE id = ?');
          stmt.run([id], function(err) {
            if (err) reject(err);
            resolve(this.changes);
          });
        });
      });
    });

    ipcMain.handle('add-weight-class', async (event, weightClass) => {
      return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO weight_classes (class_name) VALUES (?)');
        stmt.run([weightClass.class_name], function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        });
      });
    });

    ipcMain.handle('delete-weight-class', async (event, id) => {
      return new Promise((resolve, reject) => {
        // Check if any wrestlers are using this weight class
        db.get('SELECT COUNT(*) as count FROM wrestlers WHERE weight_class_id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row.count > 0) {
            reject(new Error('Cannot delete weight class while wrestlers are using it'));
            return;
          }
          
          const stmt = db.prepare('DELETE FROM weight_classes WHERE id = ?');
          stmt.run([id], function(err) {
            if (err) reject(err);
            resolve(this.changes);
          });
        });
      });
    });

    ipcMain.handle('get-championships', async () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.id, c.title_name, c.is_tag_team, s.show_name, b.name as brand_name 
                FROM championships c
                JOIN shows s ON c.show_id = s.id
                JOIN brands b ON s.brand_id = b.id
                ORDER BY b.name, c.title_name
            `;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching championships:', err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    });

    ipcMain.handle('add-championship', async (event, championship) => {
      return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO championships (title_name, show_id, is_tag_team, current_holder_id) 
          VALUES (?, ?, ?, ?)
        `);
        stmt.run([
          championship.titleName,
          championship.showId,
          championship.isTagTeam ? 1 : 0,
          championship.currentHolderId || null
        ], function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        });
      });
    });

    ipcMain.handle('update-championship-holder', async (event, data) => {
      return new Promise((resolve, reject) => {
        const stmt = db.prepare('UPDATE championships SET current_holder_id = ? WHERE id = ?');
        stmt.run([data.wrestlerId || null, data.championshipId], function(err) {
          if (err) reject(err);
          resolve(this.changes);
        });
      });
    });

    ipcMain.handle('delete-championship', async (event, id) => {
      return new Promise((resolve, reject) => {
        const stmt = db.prepare('DELETE FROM championships WHERE id = ?');
        stmt.run([id], function(err) {
          if (err) reject(err);
          resolve(this.changes);
        });
      });
    });
}

// Initialize database
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create database connection
        db = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
            
            try {
                // Enable foreign keys
                db.run('PRAGMA foreign_keys = ON', (err) => {
                    if (err) {
                        console.error('Error enabling foreign keys:', err);
                        reject(err);
                        return;
                    }
                    
                    // Check if tables exist
                    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='wrestlers'", (err, row) => {
                        if (err) {
                            console.error('Error checking tables:', err);
                            reject(err);
                            return;
                        }
                        
                        if (!row) {
                            console.log('Tables not found, creating schema...');
                            const schemaPath = path.join(__dirname, 'schema.sql');
                            console.log('Reading schema from:', schemaPath);
                            const schema = fs.readFileSync(schemaPath, 'utf8');
                            
                            // Execute schema in a transaction
                            db.exec('BEGIN TRANSACTION;' + schema + 'COMMIT;', (err) => {
                                if (err) {
                                    console.error('Error creating schema:', err);
                                    db.exec('ROLLBACK;', () => reject(err));
                                    return;
                                }
                                console.log('Schema created successfully');
                                resolve();
                            });
                        } else {
                            console.log('Tables already exist');
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.error('Error initializing database:', error);
                reject(error);
            }
        });
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

// Initialize database when app starts
app.whenReady().then(async () => {
    try {
        await initializeDatabase();
        // Initialize IPC handlers only after database is ready
        initializeIpcHandlers();
        createWindow();
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
