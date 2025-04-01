import { Injectable } from '@nestjs/common';

@Injectable()
export class GuestService {
  private readonly adjectives = [
    'Happy',
    'Brave',
    'Bright',
    'Clever',
    'Calm',
    'Daring',
    'Eager',
    'Fancy',
    'Gentle',
    'Humble',
    'Jolly',
    'Kind',
    'Lively',
    'Merry',
    'Noble',
    'Polite',
    'Quiet',
    'Rapid',
    'Sweet',
    'Witty',
  ];

  private readonly animals = [
    'Panda',
    'Tiger',
    'Eagle',
    'Dolphin',
    'Fox',
    'Wolf',
    'Koala',
    'Owl',
    'Penguin',
    'Rabbit',
    'Lion',
    'Hawk',
    'Bear',
    'Deer',
    'Squirrel',
    'Otter',
    'Elephant',
    'Zebra',
    'Raccoon',
    'Giraffe',
  ];

  generateRandomName(): string {
    const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
    const number = Math.floor(Math.random() * 100);

    return `${adjective}${animal}${number}`;
  }

  generateAvatar(name: string): string {
    // Using DiceBear API for generating avatar
    return `https://api.dicebear.com/6.x/bottts/svg?seed=${name}`;
  }
}
