// GPIO Status
app.get('/api/gpio/status', (req, res) => {
  try {
    const gpioStatus = gpio.getGpioStatus();
    res.json({
      success: true,
      gpio: gpioStatus
    });
  } catch (error) {
    console.error('❌ GPIO Status Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
