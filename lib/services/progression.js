const { getClassProfile } = require('../domain/classProfile');
const { createItem } = require('../domain/items');

function xpForLevel(level) {
  return 55 + level * 45 + Math.floor(level * level * 1.5);
}

function levelUpPlayer(player, rng) {
  const profile = getClassProfile(player.className || 'warrior');
  const gains = { health: 0, strength: 0, agility: 0 };
  const unlocked = [];

  let leveledUp = false;
  let levelDelta = 0;

  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    levelDelta += 1;
    leveledUp = true;

    const hGain = rng.nextInt(profile.growth.health.min, profile.growth.health.max);
    const sGain = rng.nextInt(profile.growth.strength.min, profile.growth.strength.max);
    const aGain = rng.nextInt(profile.growth.agility.min, profile.growth.agility.max);

    player.maxHealth += hGain;
    player.health = Math.min(player.maxHealth, player.health + hGain);
    player.strength += sGain;
    player.agility += aGain;

    gains.health += hGain;
    gains.strength += sGain;
    gains.agility += aGain;
    player.xpToNext = xpForLevel(player.level + 1);
  }

  if (player.level >= 3 && !player.unlockedLevel3) {
    unlocked.push('combat_rush');
    player.unlockedLevel3 = true;
  }

  if (player.level >= 5 && !player.unlockedLevel5) {
    unlocked.push('resilience');
    player.unlockedLevel5 = true;
  }

  return {
    leveledUp,
    levelDelta,
    statDelta: gains,
    unlocked,
  };
}

function gainXp(player, amount, rng) {
  player.xp += amount;
  return levelUpPlayer(player, rng);
}

function defaultQuests() {
  return [
    {
      id: 'defeat-two',
      title: 'Defeat 2 random enemies',
      type: 'kill',
      target: 2,
      progress: 0,
      rewardXp: 30,
      completed: false,
    },
    {
      id: 'boss-tier',
      title: 'Survive a boss encounter',
      type: 'boss',
      target: 1,
      progress: 0,
      reward: createItem('defender'),
      completed: false,
    },
    {
      id: 'no-hit-streak',
      title: 'Avoid taking damage for 3 consecutive rounds',
      type: 'streak',
      target: 3,
      progress: 0,
      reward: createItem('strength'),
      completed: false,
    },
    {
      id: 'missing-scout',
      title: 'Find the Missing Scout',
      type: 'story',
      target: 3,
      progress: 0,
      rewardGold: 45,
      reward: createItem('scout_charm'),
      completed: false,
    },
  ];
}

function applyQuestProgress(quests, event, player) {
  const updates = [];

  quests.forEach((quest) => {
    if (quest.completed) {
      return;
    }

    if (quest.type === 'kill' && event.type === 'enemy_defeated' && !event.isBoss) {
      quest.progress += 1;
    }

    if (quest.type === 'boss' && event.type === 'enemy_defeated' && event.isBoss) {
      quest.progress += 1;
    }

    if (quest.type === 'streak' && event.type === 'no_damage_round') {
      quest.progress = Math.min(quest.target, quest.progress + 1);
    }

    if (quest.type === 'streak' && event.type === 'damaged_by_enemy') {
      quest.progress = 0;
    }

    if (quest.type === 'story' && quest.id === 'missing-scout') {
      if (event.type === 'region_traveled' && event.regionId === 'old-quarry') {
        quest.progress = Math.max(quest.progress, 1);
      }

      if (
        event.type === 'enemy_defeated' &&
        event.regionId === 'old-quarry' &&
        quest.progress >= 1
      ) {
        quest.progress = Math.max(quest.progress, 2);
      }

      if (
        event.type === 'enemy_defeated' &&
        event.regionId === 'ashen-gate' &&
        event.isBoss &&
        quest.progress >= 2
      ) {
        quest.progress = 3;
      }
    }

    if (quest.progress >= quest.target) {
      quest.completed = true;
      updates.push(quest.id);

      if (quest.rewardXp) {
        gainXp(player, quest.rewardXp, player.rng);
      }

      if (quest.rewardGold) {
        player.addGold(quest.rewardGold);
      }

      if (quest.reward) {
        player.addItem({ ...quest.reward });
      }
    }
  });

  return updates;
}

module.exports = {
  xpForLevel,
  levelUpPlayer,
  gainXp,
  defaultQuests,
  applyQuestProgress,
};
