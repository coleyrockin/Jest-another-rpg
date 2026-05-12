const { getClassProfile } = require('../domain/classProfile');

function calculateDodgeChance(attacker, defender) {
  const base = Math.max(0, Math.floor(defender.agility * 0.65));
  const agilityEdge = Math.max(0, Math.floor((defender.agility - attacker.agility) / 2));
  const dodgeProfile = defender.className ? getClassProfile(defender.className).dodgeBonus : 0;
  const opportunistBonus =
    defender.aiProfile === 'opportunist' && defender.agility > attacker.agility ? 20 : 0;
  const chance = Math.min(55, base + agilityEdge + dodgeProfile + opportunistBonus + 5);
  return Math.max(0, chance);
}

function calculateCritChance(attacker, actorType) {
  if (actorType !== 'player') {
    return 8;
  }

  return (attacker.classStats && attacker.classStats.critChance) || 8;
}

function calculateCritMultiplier(attacker, actorType) {
  if (actorType !== 'player') {
    return 1.35;
  }

  return (attacker.classStats && attacker.classStats.critMultiplier) || 1.15;
}

function calculateAttackMultiplier(attacker, actorType) {
  if (actorType !== 'player') {
    return attacker.attackMultiplier || 1;
  }

  return (attacker.classStats && attacker.classStats.attackMultiplier) || 1;
}

function applyMitigation(target, damage) {
  if (target.hasStatus('defending')) {
    return Math.max(1, damage - 2);
  }

  return damage;
}

function applyStatusTick(character) {
  const logs = [];
  const poisonDamage = character.applyPoisonTick();
  if (poisonDamage > 0) {
    logs.push(`${character.name} takes ${poisonDamage} poison damage.`);
  }

  const expired = character.decrementStatusDurations();
  if (expired.includes('stunned')) {
    logs.push(`${character.name} recovered from stun.`);
  }

  if (expired.includes('defending')) {
    logs.push(`${character.name}'s guard ended.`);
  }

  return { poisonDamage, expired, logs };
}

function computeTurnOrder(player, enemy, rng) {
  const playerRoll = player.agility + rng.nextInt(1, 20);
  const enemyRoll = enemy.agility + rng.nextInt(1, 20);

  if (player.hasStatus && player.hasStatus('stunned')) {
    return 'enemy';
  }

  if (enemy.hasStatus && enemy.hasStatus('stunned')) {
    return 'player';
  }

  return playerRoll >= enemyRoll ? 'player' : 'enemy';
}

function resolveCombatTurn({
  actor,
  target,
  actorType = 'player',
  action = 'attack',
  itemIndex,
  rng,
}) {
  const stateUpdated = {};
  if (actorType === 'player' && action === 'item') {
    const result = actor.usePotion(itemIndex);
    if (!result) {
      return {
        attacker: actorType,
        target: actor.name,
        hit: false,
        crit: false,
        damage: 0,
        statusApplied: [],
        stateUpdated,
        message: 'No item available for that slot.',
        action: 'item',
      };
    }

    if (!result.result) {
      return {
        attacker: actorType,
        target: actor.name,
        hit: false,
        crit: false,
        damage: 0,
        statusApplied: [],
        stateUpdated,
        message: `${result.item.name || 'Item'} had no effect.`,
        action: 'item',
      };
    }

    return {
      attacker: actorType,
      target: actorType === 'player' ? actor.name : target.name,
      hit: true,
      crit: false,
      damage: 0,
      statusApplied: [result.result.effect],
      stateUpdated,
      message: `Used ${result.item.name}.`,
      action: 'item',
    };
  }

  if (action === 'focus') {
    actor.addStatus('defending', 1);
    return {
      attacker: actorType,
      target: actor.name,
      hit: true,
      crit: false,
      damage: 0,
      statusApplied: ['defending'],
      stateUpdated,
      message: `${actor.name} takes a defensive stance.`,
      action: 'focus',
    };
  }

  if (actor.hasStatus && actor.hasStatus('stunned')) {
    return {
      attacker: actorType,
      target: target.name,
      hit: false,
      crit: false,
      damage: 0,
      statusApplied: [],
      stateUpdated,
      message: `${actor.name} is stunned and misses the action.`,
      action: 'attack',
    };
  }

  const dodgeChance = calculateDodgeChance(actor, target, actorType, rng);
  if (rng.chance(dodgeChance)) {
    return {
      attacker: actorType,
      target: target.name,
      hit: false,
      crit: false,
      damage: 0,
      statusApplied: [],
      stateUpdated,
      message: `${actor.name}'s attack missed. ${target.name} dodged.`,
      action: 'attack',
    };
  }

  const baseDamage = actor.getAttackValue(calculateAttackMultiplier(actor, actorType));
  const isCritical = rng.chance(calculateCritChance(actor, actorType));
  const critMultiplier = isCritical ? calculateCritMultiplier(actor, actorType) : 1;
  const adjusted = Math.max(1, Math.floor(baseDamage * critMultiplier));
  const damage = applyMitigation(target, adjusted);
  target.reduceHealth(damage);

  return {
    attacker: actorType,
    target: target.name,
    hit: true,
    crit: isCritical,
    damage,
    statusApplied: [],
    stateUpdated,
    message: isCritical
      ? `${actor.name} lands a critical hit for ${damage}.`
      : `${actor.name} attacks for ${damage}.`,
    action: 'attack',
  };
}

function selectEnemyAction(enemy, player, rng) {
  const profile = {
    aggressive: () => 'attack',
    tactical: () => (enemy.health / enemy.maxHealth < 0.35 && rng.chance(30) ? 'focus' : 'attack'),
    opportunist: () => 'attack',
  };
  const selected = profile[enemy.aiProfile] || profile.aggressive;
  const type = selected();
  return { type };
}

function computeEnemyTurn(enemy, player, rng) {
  const selected = selectEnemyAction(enemy, player, rng);
  if (selected.type === 'focus') {
    return resolveCombatTurn({
      actor: enemy,
      target: player,
      actorType: 'enemy',
      action: 'focus',
      rng,
    });
  }

  return resolveCombatTurn({
    actor: enemy,
    target: player,
    actorType: 'enemy',
    action: 'attack',
    rng,
  });
}

module.exports = {
  applyStatusTick,
  computeTurnOrder,
  resolveCombatTurn,
  selectEnemyAction,
  computeEnemyTurn,
};
