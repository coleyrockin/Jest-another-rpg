const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createWorldState } = require('../domain/region');

const CURRENT_SAVE_VERSION = 2;

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
      world: createWorldState(gameState.world),
      updatedAt: new Date().toISOString(),
      timestamp: gameState.timestamp || new Date().toISOString(),
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
          recoverable: false,
        });
      }

      throw this._errorWithMeta(`Unable to read save file: ${error.message}`, {
        recoverable: false,
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw this._errorWithMeta('Save file is corrupted: invalid JSON.', {
        recoverable: true,
      });
    }

    return this.assertValidSave(data);
  }

  assertValidSave(payload) {
    if (!payload || typeof payload !== 'object') {
      throw this._errorWithMeta('Invalid save file', {
        recoverable: true,
      });
    }

    const parsedVersion = Number(payload.version);
    if (Number.isFinite(parsedVersion) && parsedVersion > CURRENT_SAVE_VERSION) {
      throw this._errorWithMeta('Unsupported save file version', {
        recoverable: false,
      });
    }

    const warnings = [];
    const expectedHash = payload.logHash;
    const computedHash = this.computeHash({ ...payload, logHash: undefined });
    if (expectedHash && expectedHash !== computedHash) {
      throw this._errorWithMeta('Save file appears to be corrupted', {
        recoverable: true,
        saveWarnings: warnings,
      });
    }

    if (!expectedHash) {
      warnings.push('Save file has no integrity checksum; integrity verification skipped.');
    }

    const migrated = this._migratePayload(payload, warnings);

    if (!migrated.player || !migrated.player.name) {
      throw this._errorWithMeta('Save file is missing player data', {
        recoverable: false,
      });
    }

    return { ...migrated, loadWarnings: warnings };
  }

  _migratePayload(payload, warnings) {
    const parsedVersion = Number(payload.version);
    const hasVersion = Number.isFinite(parsedVersion);

    if (!hasVersion || parsedVersion < 1) {
      if (!hasVersion) {
        warnings.push('Migrated legacy save (no version) to current schema.');
      } else if (parsedVersion === 0) {
        warnings.push('Migrated version 0 save data to current schema.');
      } else {
        warnings.push(`Migrated legacy save version ${parsedVersion} to current schema.`);
      }
    }

    const normalizedVersion = hasVersion ? Math.max(1, parsedVersion) : 1;

    if (normalizedVersion < CURRENT_SAVE_VERSION) {
      warnings.push(`Migrated save schema from version ${normalizedVersion} to ${CURRENT_SAVE_VERSION}.`);
    }

    return {
      version: CURRENT_SAVE_VERSION,
      seed: Number.isFinite(Number(payload.seed)) ? Number(payload.seed) : Date.now(),
      rngState: payload.rngState || null,
      player: payload.player,
      roundNumber: Number.isFinite(payload.roundNumber) ? payload.roundNumber : 0,
      activeEncounter: payload.activeEncounter || null,
      quests: Array.isArray(payload.quests) ? payload.quests : [],
      world: createWorldState(payload.world),
      updatedAt: payload.updatedAt || new Date().toISOString(),
      timestamp: payload.timestamp || payload.updatedAt || new Date().toISOString(),
      logHash: payload.logHash,
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
