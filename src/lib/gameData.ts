export type CharacterClass = 'barbarian' | 'knight' | 'ranger' | 'wizard';

export interface Ability {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  type: 'attack' | 'defense';
  target: 'single' | 'aoe' | 'self' | 'team';
  damage?: number;
  effect?: string;
}

export interface CharacterData {
  class: CharacterClass;
  name: string;
  maxHp: number;
  maxMana: number;
  abilities: Ability[];
}

export const CHARACTERS: Record<CharacterClass, CharacterData> = {
  barbarian: {
    class: 'barbarian',
    name: 'Barbarian',
    maxHp: 210,
    maxMana: 80,
    abilities: [
      {
        id: 'savage_strike',
        name: 'Savage Strike',
        description: 'Standard single-target melee damage',
        manaCost: 15,
        type: 'attack',
        target: 'single',
        damage: 35,
      },
      {
        id: 'whirlwind',
        name: 'Whirlwind',
        description: 'Sweeping AoE attack hitting both opponents',
        manaCost: 30,
        type: 'attack',
        target: 'aoe',
        damage: 25,
      },
      {
        id: 'executioner_smash',
        name: "Executioner's Smash",
        description: 'Devastating single-target massive damage',
        manaCost: 45,
        type: 'attack',
        target: 'single',
        damage: 65,
      },
      {
        id: 'guard_gather',
        name: 'Guard & Gather',
        description: 'Reduces incoming damage and restores Mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 20 mana, reduce next damage by 50%',
      },
      {
        id: 'war_cry',
        name: 'War Cry',
        description: 'Permanent self-stacking Attack Power buff',
        manaCost: 25,
        type: 'defense',
        target: 'self',
        effect: 'Increase attack power by 15% (stacks)',
      },
    ],
  },
  knight: {
    class: 'knight',
    name: 'Knight',
    maxHp: 165,
    maxMana: 100,
    abilities: [
      {
        id: 'valiant_strike',
        name: 'Valiant Strike',
        description: 'Standard single-target damage',
        manaCost: 15,
        type: 'attack',
        target: 'single',
        damage: 30,
      },
      {
        id: 'shield_bash',
        name: 'Shield Bash',
        description: 'Damage + shield buff',
        manaCost: 30,
        type: 'attack',
        target: 'single',
        damage: 28,
        effect: 'Gain shield for 25 HP',
      },
      {
        id: 'vanguard_charge',
        name: "Vanguard's Charge",
        description: 'Damage + team attack buff',
        manaCost: 40,
        type: 'attack',
        target: 'single',
        damage: 35,
        effect: 'Buff team attack power by 10%',
      },
      {
        id: 'guard_gather',
        name: 'Guard & Gather',
        description: 'Reduces incoming damage and restores Mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 20 mana, reduce next damage by 50%',
      },
      {
        id: 'divine_rest',
        name: 'Divine Rest',
        description: 'Heals own HP',
        manaCost: 35,
        type: 'defense',
        target: 'self',
        effect: 'Restore 45 HP',
      },
    ],
  },
  ranger: {
    class: 'ranger',
    name: 'Ranger',
    maxHp: 120,
    maxMana: 110,
    abilities: [
      {
        id: 'precise_shot',
        name: 'Precise Shot',
        description: 'Standard single-target damage',
        manaCost: 15,
        type: 'attack',
        target: 'single',
        damage: 32,
      },
      {
        id: 'pinning_arrow',
        name: 'Pinning Arrow',
        description: 'Low damage but applies Bind (skip next turn)',
        manaCost: 30,
        type: 'attack',
        target: 'single',
        damage: 18,
        effect: 'Target skips next turn',
      },
      {
        id: 'hail_of_arrows',
        name: 'Hail of Arrows',
        description: 'Solid AoE damage to both opponents',
        manaCost: 40,
        type: 'attack',
        target: 'aoe',
        damage: 28,
      },
      {
        id: 'guard_gather',
        name: 'Guard & Gather',
        description: 'Reduces incoming damage and restores Mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 20 mana, reduce next damage by 50%',
      },
      {
        id: 'shadow_meld',
        name: 'Shadow Meld',
        description: 'Next attack will miss',
        manaCost: 30,
        type: 'defense',
        target: 'self',
        effect: 'Become invisible, next attack misses',
      },
    ],
  },
  wizard: {
    class: 'wizard',
    name: 'Wizard',
    maxHp: 90,
    maxMana: 130,
    abilities: [
      {
        id: 'arcane_burst',
        name: 'Arcane Burst',
        description: 'Standard AoE damage to both opponents',
        manaCost: 25,
        type: 'attack',
        target: 'aoe',
        damage: 22,
      },
      {
        id: 'mind_siphon',
        name: 'Mind Siphon',
        description: 'Damages and drains opponent Mana',
        manaCost: 35,
        type: 'attack',
        target: 'aoe',
        damage: 20,
        effect: 'Burn 15 mana from each target',
      },
      {
        id: 'cataclysm',
        name: 'Cataclysm',
        description: 'Massive AoE that weakens opponents',
        manaCost: 50,
        type: 'attack',
        target: 'aoe',
        damage: 35,
        effect: 'Reduce max HP, mana, and attack power by 10%',
      },
      {
        id: 'guard_gather',
        name: 'Guard & Gather',
        description: 'Reduces incoming damage and restores Mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 20 mana, reduce next damage by 50%',
      },
      {
        id: 'aura_of_life',
        name: 'Aura of Life',
        description: 'Heals both the Wizard and teammate',
        manaCost: 40,
        type: 'defense',
        target: 'team',
        effect: 'Restore 35 HP to self and ally',
      },
    ],
  },
};
