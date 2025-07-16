import gpiod from 'node-libgpiod';

console.log('=== Testing node-libgpiod API ===');

try {
  // Test getChipNames
  const chipNames = gpiod.getChipNames();
  console.log('Available chips:', chipNames);
  
  if (chipNames.length > 0) {
    const chipName = chipNames[0];
    console.log(`Testing with chip: ${chipName}`);
    
    // Test Chip constructor
    const chip = new gpiod.Chip(chipName);
    console.log('Chip created successfully');
    console.log('Chip methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chip)));
    
    // Test getLine
    const line = chip.getLine(17);
    console.log('Line 17 obtained');
    console.log('Line methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(line)));
    
    chip.close();
    console.log('Chip closed');
  }
} catch (error) {
  console.error('Error:', error.message);
}
