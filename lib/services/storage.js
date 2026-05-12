const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const CURRENT_SAVE_VERSION = 1;

class StorageService {
  constructor({ savePath } = {}) {
    this.savePath = savePath || path.join(process.cwd(), 'savegame.json');
  }

  async saveExists() {
    try {
      await fs.access(this.savePath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteSave() {
    if (!(await this.saveExists())) {
      return false;
    }

    await fs.unlink(this.savePath);
    return true;
  }

  async saveGame(gameState) {
    const payload = {
      version: CURRENT_SAVE_VERSION,
      seed: gameState.seed,
      rngState: gameState.rngState || null,
      player: gameState.player,
      roundNumber: gameState.roundNumber,
      activeEncounter: gameState.activeEncounter,
      quests: gameState.quests,
      updatedAt: new Date().toISOString(),
      timestamp: gameState.timestamp || new Date().toISOString()
    };

    payload.logHash = this.computeHash(payload);
    const tmpPath = `${this.savePath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    await fs.rename(tmpPath, this.savePath);
  }

  async loadGame() {
    let raw;
    try {
      raw = await fs.readFile(this.savePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw this._errorWithMeta('No save file found.', {
          recoverable: false
        });
      }

      throw this._errorWithMeta(`Unable to read save file: ${error.message}`, {
        recoverable: false
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw this._errorWithMeta('Save file is corrupted: invalid JSON.', {
        recoverable: true
      });
    }

    return this.assertValidSave(data);
  }

  assertValidSave(payload) {
    if (!payload || typeof payload !== 'object') {
      throw this._errorWithMeta('Invalid save file', {
        recoverable: true
      });
    }

    const warnings = [];
    const migrated = this._migratePayload(payload, warnings);

    if (migrated.version > CURRENT_SAVE_VERSION) {
      throw this._errorWithMeta('Unsupported save file version', {
        recoverable: false
      });
    }

    const expectedHash = migrated.logHash;
    const computedHash = this.computeHash({ ...migrated, logHash: undefined });
    if (expectedHash && expectedHash !== computedHash) {
      throw this._errorWithMeta('Save file appears to be corrupted', {
        recoverable: true,
        saveWarnings: warnings
      });
    }

    if (!expectedHash) {
      warnings.push('Save file has no integrity checksum; integrity verification skipped.');
    }

    if (!migrated.player || !migrated.player.name) {
      throw this._errorWithMeta('Save file is missing player data', {
        recoverable: false
      });
    }

    return { ...migrated, loadWarnings: warnings };
  }

  _migratePayload(payload, warnings) {
    const hasVersion = Number.isFinite(payload.version);
    if (!hasVersion || payload.version < 1) {
      if (!hasVersion) {
        warnings.push('Migrated legacy save (no version) to current schema.');
      } else if (payload.version === 0) {
        warnings.push('Migrated version 0 save data to current schema.');
      } else {
        warnings.push(`Migrated legacy save version ${payload.version} to current schema.`);
      }
    }

    return {
      version: Math.max(1, Number.isFinite(payload.version) ? payload.version : 1),
      seed: Number.isFinite(Number(payload.seed)) ? Number(payload.seed) : Date.now(),
      rngState: payload.rngState || null,
      player: payload.player,
      roundNumber: Number.isFinite(payload.roundNumber) ? payload.roundNumber : 0,
      activeEncounter: payload.activeEncounter || null,
      quests: Array.isArray(payload.quests) ? payload.quests : [],
      updatedAt: payload.updatedAt || new Date().toISOString(),
      timestamp: payload.timestamp || payload.updatedAt || new Date().toISOString(),
      logHash: payload.logHash
    };
  }

  _errorWithMeta(message, details = {}) {
    const error = new Error(message);
    Object.assign(error, details);
    return error;
  }

  computeHash(payload) {
    const clone = JSON.parse(JSON.stringify(payload));
    delete clone.logHash;
    const contents = JSON.stringify(clone);
    return crypto.createHash('sha256').update(contents).digest('hex');
  }
}

module.exports = StorageService;
