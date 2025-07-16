import gpiod from 'node-libgpiod';

console.log('Available methods:', Object.keys(gpiod));
console.log('Type:', typeof gpiod);

// Test specific methods
if (gpiod.Chip) console.log('gpiod.Chip:', typeof gpiod.Chip);
if (gpiod.chip) console.log('gpiod.chip:', typeof gpiod.chip);
if (gpiod.openChip) console.log('gpiod.openChip:', typeof gpiod.openChip);

// List all available
for (const key in gpiod) {
  console.log(`${key}: ${typeof gpiod[key]}`);
}
