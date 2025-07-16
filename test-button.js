import gpio from './gpio.js';

async function testButton() {
  try {
    await gpio.setupGpio();
    const buttonState = await gpio.readButton();
    console.log('Current button state:', buttonState);
    console.log('Button status:', buttonState ? 'PRESSED' : 'NOT PRESSED');
    
    const status = gpio.getGpioStatus();
    console.log('GPIO Status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testButton();
