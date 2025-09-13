// Cloud Storage Manager
import { database } from './firebase-config.js';
import { ref, set, get, push, remove, onValue, off } from 'firebase/database';

class CloudStorage {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.setupConnectionListener();
  }

  setupConnectionListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // حفظ البيانات في السحابة
  async saveData(path, data) {
    try {
      if (this.isOnline) {
        const dataRef = ref(database, path);
        await set(dataRef, {
          ...data,
          timestamp: Date.now(),
          lastModified: new Date().toISOString()
        });
        return true;
      } else {
        // حفظ في التخزين المحلي إذا لم يكن متصل
        this.pendingOperations.push({ type: 'save', path, data });
        localStorage.setItem(path, JSON.stringify(data));
        return false;
      }
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      // احتياطي: حفظ في التخزين المحلي
      localStorage.setItem(path, JSON.stringify(data));
      return false;
    }
  }

  // استرجاع البيانات من السحابة
  async getData(path) {
    try {
      if (this.isOnline) {
        const dataRef = ref(database, path);
        const snapshot = await get(dataRef);
        if (snapshot.exists()) {
          return snapshot.val();
        }
      }
      
      // احتياطي: استرجاع من التخزين المحلي
      const localData = localStorage.getItem(path);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('خطأ في استرجاع البيانات:', error);
      // احتياطي: استرجاع من التخزين المحلي
      const localData = localStorage.getItem(path);
      return localData ? JSON.parse(localData) : null;
    }
  }

  // إضافة بيانات جديدة
  async addData(path, data) {
    try {
      if (this.isOnline) {
        const listRef = ref(database, path);
        const newRef = push(listRef);
        await set(newRef, {
          ...data,
          id: newRef.key,
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        });
        return newRef.key;
      } else {
        // حفظ في التخزين المحلي
        const id = 'temp_' + Date.now();
        const dataWithId = { ...data, id, timestamp: Date.now() };
        this.pendingOperations.push({ type: 'add', path, data: dataWithId });
        
        const existingData = JSON.parse(localStorage.getItem(path) || '{}');
        existingData[id] = dataWithId;
        localStorage.setItem(path, JSON.stringify(existingData));
        return id;
      }
    } catch (error) {
      console.error('خطأ في إضافة البيانات:', error);
      return null;
    }
  }

  // حذف البيانات
  async deleteData(path) {
    try {
      if (this.isOnline) {
        const dataRef = ref(database, path);
        await remove(dataRef);
        return true;
      } else {
        this.pendingOperations.push({ type: 'delete', path });
        localStorage.removeItem(path);
        return false;
      }
    } catch (error) {
      console.error('خطأ في حذف البيانات:', error);
      return false;
    }
  }

  // مراقبة التغييرات في الوقت الفعلي
  listenToData(path, callback) {
    if (this.isOnline) {
      const dataRef = ref(database, path);
      onValue(dataRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : null;
        callback(data);
      });
      return () => off(dataRef);
    }
    return null;
  }

  // مزامنة العمليات المعلقة
  async syncPendingOperations() {
    if (!this.isOnline || this.pendingOperations.length === 0) return;

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'save':
            await this.saveData(operation.path, operation.data);
            break;
          case 'add':
            await this.addData(operation.path, operation.data);
            break;
          case 'delete':
            await this.deleteData(operation.path);
            break;
        }
      } catch (error) {
        console.error('خطأ في مزامنة العملية:', error);
        // إعادة العملية إلى القائمة المعلقة
        this.pendingOperations.push(operation);
      }
    }
  }

  // التحقق من حالة الاتصال
  isConnected() {
    return this.isOnline;
  }

  // الحصول على إحصائيات التخزين
  async getStorageStats() {
    try {
      const stats = {
        isOnline: this.isOnline,
        pendingOperations: this.pendingOperations.length,
        localStorageUsed: this.getLocalStorageSize(),
        lastSync: localStorage.getItem('lastSyncTime') || 'لم يتم المزامنة بعد'
      };
      return stats;
    } catch (error) {
      console.error('خطأ في الحصول على إحصائيات التخزين:', error);
      return null;
    }
  }

  getLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2) + ' KB';
  }
}

// إنشاء مثيل واحد للاستخدام في جميع أنحاء التطبيق
export const cloudStorage = new CloudStorage();