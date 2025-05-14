// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'scheduleNotification') {
    const { timeInMs, options } = event.data;
    setTimeout(() => {
      self.registration.showNotification(options.title, options).then(() => {
        if (options.sound) {
          // Store sound URL in notification data for later access
          self._notificationSound = options.sound;
        }
      });
    }, timeInMs);
  }
});

// Handle notification click to play sound
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (self._notificationSound) {
    event.waitUntil(
      self.registration.showNotification(self._notificationSound, {
        body: 'Playing notification sound',
        icon: '/favicon.ico'
      })
    );
    
    // Clear the sound after playing
    self._notificationSound = null;
  }
  
  // Handle notification click, e.g., open a specific URL
  clients.openWindow('/');
});

// Optional: Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Handle notification click, e.g., open a specific URL
  clients.openWindow('/');
});
