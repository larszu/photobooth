const gpiod = require('node-libgpiod');
console.log('Available methods:', Object.keys(gpiod));
console.log('Type:', typeof gpiod);

// Test specific methods
console.log('gpiod.Chip:', typeof gpiod.Chip);
console.log('gpiod.chip:', typeof gpiod.chip);
console.log('gpiod.openChip:', typeof gpiod.openChip);

// List all available
for (const key in gpiod) {
  console.log(`${key}: ${typeof gpiod[key]}`);
}
