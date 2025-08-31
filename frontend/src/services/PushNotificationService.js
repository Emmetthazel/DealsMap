class PushNotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.subscription = null;
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      // Check if user has already granted permission
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  // Request permission for push notifications
  async requestPermission() {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription
      this.subscription = await registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Create new subscription
        this.subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
        });
      }

      // Send subscription to backend
      await this.sendSubscriptionToBackend(this.subscription);
      
      console.log('Successfully subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush() {
    if (!this.subscription) {
      return;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      // Notify backend about unsubscription
      await this.removeSubscriptionFromBackend();
      
      console.log('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Send subscription to backend
  async sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch('/api/notifications/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send subscription to backend: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to send subscription to backend:', error);
      throw error;
    }
  }

  // Remove subscription from backend
  async removeSubscriptionFromBackend() {
    try {
      const response = await fetch('/api/notifications/unsubscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove subscription from backend: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to remove subscription from backend:', error);
      throw error;
    }
  }

  // Show local notification
  showNotification(title, options = {}) {
    if (!this.isSupported) {
      return;
    }

    const defaultOptions = {
      body: '',
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [100, 50, 100],
      data: {},
      actions: []
    };

    const notificationOptions = { ...defaultOptions, ...options };

    try {
      const notification = new Notification(title, notificationOptions);
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Get VAPID public key (this should come from your backend)
  getVapidPublicKey() {
    // This is a placeholder - replace with your actual VAPID public key
    return 'BEl62iUYgUivxIkv69yViEuiBIa1l9aM6c5Q5XxhJBEj6Z7m8eQ0S8iK0mNkkjcNtMNTMQ5LuuMQo8kRgUA8EY';
  }

  // Convert VAPID key from base64 to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get subscription status
  getStatus() {
    return {
      isSupported: this.isSupported,
      isSubscribed: !!this.subscription,
      permission: Notification.permission
    };
  }

  // Test notification
  async testNotification() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    this.showNotification('Test Notification', {
      body: 'This is a test notification from DealsMap',
      data: { type: 'test' }
    });
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
