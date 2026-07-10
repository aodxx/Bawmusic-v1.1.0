/**
 * BAWMUSIC — Main App Controller (Alpine.js store)
 */

function app() {
  return {
    currentView: 'dashboard',
    loading: true,
    darkMode: true,
    settings: {},
    navItems: [
      { view: 'dashboard', icon: 'fa-house', label: 'หน้าหลัก' },
      { view: 'bookings', icon: 'fa-calendar-check', label: 'การจอง' },
      { view: 'customers', icon: 'fa-users', label: 'ลูกค้า' },
      { view: 'equipment', icon: 'fa-boxes-stacked', label: 'อุปกรณ์' },
      { view: 'settings', icon: 'fa-gear', label: 'ตั้งค่า' }
    ],
    viewTitles: {
      dashboard: 'ภาพรวมวันนี้',
      bookings: 'รายการจองทั้งหมด',
      customers: 'จัดการลูกค้า',
      equipment: 'คลังอุปกรณ์',
      analytics: 'สถิติและรายงาน',
      settings: 'ตั้งค่าระบบ'
    },

    async init() {
      window.__app = this;
      this.loading = true;
      try {
        this.settings = await BawmusicAPI.getSettings();
      } catch (e) {
        console.warn('Could not load settings — check API_URL in js/api.js', e);
      }
      this.loading = false;
      this.renderCurrentView();
    },

    setView(view) {
      this.currentView = view;
      this.renderCurrentView();
    },

    renderCurrentView() {
      // small delay lets x-show transition mount the container first
      requestAnimationFrame(() => {
        switch (this.currentView) {
          case 'dashboard': renderDashboard(); break;
          case 'bookings': renderBookings(); break;
          case 'customers': renderCustomers(); break;
          case 'equipment': renderEquipment(); break;
          case 'analytics': renderAnalytics(); break;
          case 'settings': renderSettings(); break;
        }
      });
    },

    openBookingForm(id) {
      openBookingForm(id);
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      // Bawmusic ships dark/luxury theme by default; light theme toggle reserved for future release
      Utils.toast('info', this.darkMode ? 'โหมดมืด' : 'โหมดสว่าง (เร็วๆ นี้)');
    }
  };
}

// Add 'analytics' to nav on wider screens by inserting between equipment and settings if desired.
// Kept to 5 bottom-nav items per mobile UX best practice; Analytics is reachable via Dashboard quick action.
