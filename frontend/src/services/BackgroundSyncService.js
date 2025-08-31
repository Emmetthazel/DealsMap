class BackgroundSyncService {
  constructor() {
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Load existing sync queue from localStorage
    this.loadSyncQueue();
  }

  // Add an action to the sync queue
  addToSyncQueue(action) {
    const syncItem = {
      id: Date.now() + Math.random(),
      action,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3
    };

    this.syncQueue.push(syncItem);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return syncItem.id;
  }

  // Process the sync queue
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        await this.processSyncItem(item);
        this.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Failed to process sync item:', item, error);
        item.retries++;
        
        if (item.retries >= item.maxRetries) {
          // Remove failed items after max retries
          this.removeFromSyncQueue(item.id);
        }
      }
    }
  }

  // Process a single sync item
  async processSyncItem(item) {
    const { action } = item;

    switch (action.type) {
      case 'CREATE_DEAL':
        return this.syncCreateDeal(action.data);
      
      case 'UPDATE_DEAL':
        return this.syncUpdateDeal(action.data);
      
      case 'DELETE_DEAL':
        return this.syncDeleteDeal(action.data);
      
      case 'CREATE_REVIEW':
        return this.syncCreateReview(action.data);
      
      case 'UPDATE_REVIEW':
        return this.syncUpdateReview(action.data);
      
      default:
        throw new Error(`Unknown sync action type: ${action.type}`);
    }
  }

  // Sync create deal action
  async syncCreateDeal(data) {
    const response = await fetch('/api/deals/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync create deal: ${response.status}`);
    }

    return response.json();
  }

  // Sync update deal action
  async syncUpdateDeal(data) {
    const response = await fetch(`/api/deals/${data.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync update deal: ${response.status}`);
    }

    return response.json();
  }

  // Sync delete deal action
  async syncDeleteDeal(data) {
    const response = await fetch(`/api/deals/${data.id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to sync delete deal: ${response.status}`);
    }

    return response.json();
  }

  // Sync create review action
  async syncCreateReview(data) {
    const response = await fetch('/api/reviews/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync create review: ${response.status}`);
    }

    return response.json();
  }

  // Sync update review action
  async syncUpdateReview(data) {
    const response = await fetch(`/api/reviews/${data.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync update review: ${response.status}`);
    }

    return response.json();
  }

  // Save sync queue to localStorage
  saveSyncQueue() {
    try {
      localStorage.setItem('dealsmap_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Load sync queue from localStorage
  loadSyncQueue() {
    try {
      const saved = localStorage.getItem('dealsmap_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Remove item from sync queue
  removeFromSyncQueue(id) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    this.saveSyncQueue();
  }

  // Get sync queue status
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      hasPendingItems: this.syncQueue.length > 0
    };
  }

  // Clear sync queue
  clearQueue() {
    this.syncQueue = [];
    this.saveSyncQueue();
  }
}

// Create singleton instance
const backgroundSyncService = new BackgroundSyncService();

export default backgroundSyncService;
