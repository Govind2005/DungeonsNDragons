import barbarianImg from '../characters/barbarian.png';
import knightImg from '../characters/knight.png';
import rangerImg from '../characters/ranger.png';
import wizardImg from '../characters/wizard.png';

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
  image: string;
}

export const CHARACTERS: Record<CharacterClass, CharacterData> = {
  barbarian: {
    class: 'barbarian',
    name: 'Barbarian',
    maxHp: 140,
    maxMana: 80,
    image: barbarianImg,
    abilities: [
      {
        id: 'SAVAGE_STRIKE',
        name: 'Savage Strike (A1)',
        description: 'Standard powerful melee attack',
        manaCost: 10,
        type: 'attack',
        target: 'single',
        damage: 18,
      },
      {
        id: 'WHIRLWIND',
        name: 'Whirlwind (A2)',
        description: 'Sweeping AoE attack hitting BOTH enemies',
        manaCost: 25,
        type: 'attack',
        target: 'aoe',
        damage: 14,
      },
      {
        id: 'EXECUTIONERS_SMASH',
        name: "Executioner's Smash (A3)",
        description: 'Devastating strike to a single enemy',
        manaCost: 45,
        type: 'attack',
        target: 'single',
        damage: 40,
      },
      {
        id: 'GUARD_AND_GATHER',
        name: 'Guard & Gather (D1)',
        description: 'Reduces incoming damage by 20 and restores 15 mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 15 Mana, -20 Damage taken',
      },
      {
        id: 'WAR_CRY',
        name: 'War Cry (D2)',
        description: 'Gain +3 Attack permanently and reduce incoming damage by 15 next turn',
        manaCost: 20,
        type: 'defense',
        target: 'self',
        effect: '+3 ATK Permanently, -15 Damage taken',
      },
    ],
  },
  knight: {
    class: 'knight',
    name: 'Knight',
    maxHp: 160,
    maxMana: 90,
    image: knightImg,
    abilities: [
      {
        id: 'VALIANT_STRIKE',
        name: 'Valiant Strike (A1)',
        description: 'Balanced single-target damage',
        manaCost: 10,
        type: 'attack',
        target: 'single',
        damage: 14,
      },
      {
        id: 'SHIELD_BASH',
        name: 'Shield Bash (A2)',
        description: 'Damage + reduce next incoming damage by 20',
        manaCost: 20,
        type: 'attack',
        target: 'single',
        damage: 16,
        effect: 'Gain -20 Damage Reduction shield',
      },
      {
        id: 'VANGUARDS_CHARGE',
        name: "Vanguard's Charge (A3)",
        description: 'Impactful attack + permanently increases Attack of Knight & teammate by 2',
        manaCost: 45,
        type: 'attack',
        target: 'single',
        damage: 26,
        effect: '+2 ATK for team permanently',
      },
      {
        id: 'GUARD_AND_GATHER',
        name: 'Guard & Gather (D1)',
        description: 'Reduces incoming damage by 20 and restores 15 mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 15 Mana, -20 Damage taken',
      },
      {
        id: 'DIVINE_REST',
        name: 'Divine Rest (D2)',
        description: 'Heals the Knight for 35 HP',
        manaCost: 25,
        type: 'defense',
        target: 'self',
        effect: 'Restore 35 HP',
      },
    ],
  },
  ranger: {
    class: 'ranger',
    name: 'Ranger',
    maxHp: 100,
    maxMana: 110,
    image: rangerImg,
    abilities: [
      {
        id: 'PRECISE_SHOT',
        name: 'Precise Shot (A1)',
        description: 'Accurate single-target shot',
        manaCost: 10,
        type: 'attack',
        target: 'single',
        damage: 16,
      },
      {
        id: 'PINNING_ARROW',
        name: 'Pinning Arrow (A2)',
        description: 'Low damage + Blind (target skips next turn)',
        manaCost: 25,
        type: 'attack',
        target: 'single',
        damage: 8,
        effect: 'Target skips next turn',
      },
      {
        id: 'HAIL_OF_ARROWS',
        name: 'Hail of Arrows (A3)',
        description: 'Volley of arrows hitting BOTH enemies',
        manaCost: 40,
        type: 'attack',
        target: 'aoe',
        damage: 18,
      },
      {
        id: 'GUARD_AND_GATHER',
        name: 'Guard & Gather (D1)',
        description: 'Reduces incoming damage by 20 and restores 15 mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 15 Mana, -20 Damage taken',
      },
      {
        id: 'SHADOW_MELD',
        name: 'Shadow Meld (D2)',
        description: 'Become invisible; next attack against Ranger deals 0 damage',
        manaCost: 20,
        type: 'defense',
        target: 'self',
        effect: 'Next incoming attack deals 0 damage',
      },
    ],
  },
  wizard: {
    class: 'wizard',
    name: 'Wizard',
    maxHp: 90,
    maxMana: 140,
    image: wizardImg,
    abilities: [
      {
        id: 'ARCANE_BURST',
        name: 'Arcane Burst (A1)',
        description: 'Arcane explosion hitting BOTH enemies',
        manaCost: 10,
        type: 'attack',
        target: 'aoe',
        damage: 12,
      },
      {
        id: 'MIND_SIPHON',
        name: 'Mind Siphon (A2)',
        description: 'Damage BOTH enemies and drain 10 mana from each',
        manaCost: 25,
        type: 'attack',
        target: 'aoe',
        damage: 14,
        effect: 'Siphon 10 mana from each enemy',
      },
      {
        id: 'CATACLYSM',
        name: 'Cataclysm (A3)',
        description: 'Massive AoE damage + reduces enemy Max HP/Mana by 10 and Attack by 2',
        manaCost: 50,
        type: 'attack',
        target: 'aoe',
        damage: 28,
        effect: 'Permanently cripples enemy stats',
      },
      {
        id: 'GUARD_AND_GATHER',
        name: 'Guard & Gather (D1)',
        description: 'Reduces incoming damage by 20 and restores 15 mana',
        manaCost: 0,
        type: 'defense',
        target: 'self',
        effect: 'Restore 15 Mana, -20 Damage taken',
      },
      {
        id: 'AURA_OF_LIFE',
        name: 'Aura of Life (D2)',
        description: 'Heals self and teammate for 25 HP',
        manaCost: 30,
        type: 'defense',
        target: 'team',
        effect: 'Restore 25 HP to self & ally',
      },
    ],
  },
};

export interface CharacterClass_ {
  id: CharacterClass;
  name: string;
  emoji: string;
}

export const CHARACTER_CLASSES: CharacterClass_[] = [
  { id: 'barbarian', name: 'Barbarian', emoji: '⚔️' },
  { id: 'knight', name: 'Knight', emoji: '🛡️' },
  { id: 'ranger', name: 'Ranger', emoji: '🏹' },
  { id: 'wizard', name: 'Wizard', emoji: '🔮' },
];
