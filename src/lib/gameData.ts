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
    maxHp: 210,
    maxMana: 80,
    image: barbarianImg,
    abilities: [
      {
        id: 'BASIC_ATTACK',
        name: 'Basic Attack',
        description: 'Standard single-target melee damage',
        manaCost: 0,
        type: 'attack',
        target: 'single',
        damage: 20,
      },
      {
        id: 'RAGE_STRIKE',
        name: 'Rage Strike',
        description: 'Powerful strike with 1.5x damage',
        manaCost: 25,
        type: 'attack',
        target: 'single',
        damage: 35,
      },
      {
        id: 'WHIRLWIND',
        name: 'Whirlwind',
        description: 'Sweeping AoE attack hitting all enemies',
        manaCost: 40,
        type: 'attack',
        target: 'aoe',
        damage: 25,
      },
      {
        id: 'BATTLE_CRY',
        name: 'Battle Cry',
        description: 'Buffs own attack power for 2 turns',
        manaCost: 20,
        type: 'defense',
        target: 'self',
        effect: 'Increase attack power',
      },
    ],
  },
  knight: {
    class: 'knight',
    name: 'Knight',
    maxHp: 165,
    maxMana: 100,
    image: knightImg,
    abilities: [
      {
        id: 'BASIC_ATTACK',
        name: 'Basic Attack',
        description: 'Standard single-target damage',
        manaCost: 0,
        type: 'attack',
        target: 'single',
        damage: 25,
      },
      {
        id: 'SHIELD_BASH',
        name: 'Shield Bash',
        description: 'Damage + stun (bind) target',
        manaCost: 20,
        type: 'attack',
        target: 'single',
        damage: 20,
      },
      {
        id: 'HEAL',
        name: 'Heal',
        description: 'Heals self or ally for 30 HP',
        manaCost: 30,
        type: 'defense',
        target: 'single',
        effect: 'Restore 30 HP',
      },
      {
        id: 'GUARDIAN_AURA',
        name: 'Guardian Aura',
        description: 'Buffs team defense for 2 turns',
        manaCost: 35,
        type: 'defense',
        target: 'team',
        effect: 'Team defense buff',
      },
    ],
  },
  ranger: {
    class: 'ranger',
    name: 'Ranger',
    maxHp: 120,
    maxMana: 110,
    image: rangerImg,
    abilities: [
      {
        id: 'BASIC_ATTACK',
        name: 'Basic Attack',
        description: 'Standard single-target damage',
        manaCost: 0,
        type: 'attack',
        target: 'single',
        damage: 28,
      },
      {
        id: 'PRECISE_SHOT',
        name: 'Precise Shot',
        description: 'Ignores invisibility',
        manaCost: 15,
        type: 'attack',
        target: 'single',
        damage: 32,
      },
      {
        id: 'BINDING_ARROW',
        name: 'Binding Arrow',
        description: 'Low damage + Bind (skip turn)',
        manaCost: 25,
        type: 'attack',
        target: 'single',
        damage: 15,
        effect: 'Target skips turn',
      },
      {
        id: 'VANISH',
        name: 'Vanish',
        description: 'Become invisible to next attack',
        manaCost: 20,
        type: 'defense',
        target: 'self',
        effect: 'Invisibility',
      },
    ],
  },
  wizard: {
    class: 'wizard',
    name: 'Wizard',
    maxHp: 90,
    maxMana: 130,
    image: wizardImg,
    abilities: [
      {
        id: 'BASIC_ATTACK',
        name: 'Basic Attack',
        description: 'Standard single-target damage',
        manaCost: 0,
        type: 'attack',
        target: 'single',
        damage: 20,
      },
      {
        id: 'ARCANE_BOLT',
        name: 'Arcane Bolt',
        description: 'High damage magic bolt',
        manaCost: 30,
        type: 'attack',
        target: 'single',
        damage: 38,
      },
      {
        id: 'CHAIN_LIGHTNING',
        name: 'Chain Lightning',
        description: 'AoE damage hitting all enemies',
        manaCost: 45,
        type: 'attack',
        target: 'aoe',
        damage: 20,
      },
      {
        id: 'MANA_DRAIN',
        name: 'Mana Drain',
        description: 'Drains 30 mana and deals damage',
        manaCost: 20,
        type: 'attack',
        target: 'single',
        damage: 15,
      },
      {
        id: 'WEAKEN',
        name: 'Weaken',
        description: 'Reduces opponent attack power',
        manaCost: 25,
        type: 'defense',
        target: 'single',
        effect: 'Attack debuff',
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
