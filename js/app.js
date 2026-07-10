/**
 * BAWMUSIC — Main App Controller (Alpine.js store)
 */

function app() {
  return {
    currentView: 'dashboard',
    loading: true,
    darkMode: document.documentElement.getAttribute('data-theme') !== 'light',
    settings: {},
    showInstallBanner: false,
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream,
    deferredInstallPrompt: null,
    themeCheckInterval: null,
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

      // ตรวจจับเวลาซ้ำทุก 5 นาที เพื่อสลับธีมอัตโนมัติ (ถ้าผู้ใช้ยังไม่เคยสลับเองด้วยมือ)
      this.themeCheckInterval = setInterval(() => this.autoApplyTheme(), 5 * 60 * 1000);

      // ดักจับ event ติดตั้งแอป (Android/Chrome)
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        if (!this.isStandalone()) this.showInstallBanner = true;
      });
      window.addEventListener('appinstalled', () => {
        this.showInstallBanner = false;
        Utils.toast('success', 'ติดตั้งแอปสำเร็จ');
      });

      // iOS ไม่รองรับ beforeinstallprompt — แสดงคำแนะนำเองถ้ายังไม่ได้ติดตั้ง
      if (this.isIOS && !this.isStandalone() && !sessionStorage.getItem('bawmusic_install_dismissed')) {
        this.showInstallBanner = true;
      }

      try {
        this.settings = await BawmusicAPI.getSettings();
      } catch (e) {
        console.warn('Could not load settings — check API_URL in js/api.js', e);
      }
      this.loading = false;
      this.renderCurrentView();
    },

    isStandalone() {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    },

    async installApp() {
      if (!this.deferredInstallPrompt) return;
      this.deferredInstallPrompt.prompt();
      const { outcome } = await this.deferredInstallPrompt.userChoice;
      this.deferredInstallPrompt = null;
      this.showInstallBanner = false;
      if (outcome !== 'accepted') {
        sessionStorage.setItem('bawmusic_install_dismissed', '1');
      }
    },

    dismissInstallBanner() {
      this.showInstallBanner = false;
      sessionStorage.setItem('bawmusic_install_dismissed', '1');
    },

    autoApplyTheme() {
      const override = localStorage.getItem('bawmusic_theme_override');
      if (override) return; // ผู้ใช้ตั้งค่าเองแล้ว ไม่ต้องสลับอัตโนมัติ
      const hour = new Date().getHours();
      const theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      this.darkMode = theme === 'dark';
      this.updateThemeColorMeta(theme);
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
      const theme = this.darkMode ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('bawmusic_theme_override', theme);
      this.updateThemeColorMeta(theme);
      Utils.toast('success', this.darkMode ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง');
    },

    resetThemeToAuto() {
      localStorage.removeItem('bawmusic_theme_override');
      this.autoApplyTheme();
      Utils.toast('success', 'ธีมจะสลับอัตโนมัติตามเวลาอีกครั้ง');
    },

    updateThemeColorMeta(theme) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f2e8' : '#1a1a2e');
    }
  };
}

// Add 'analytics' to nav on wider screens by inserting between equipment and settings if desired.
// Kept to 5 bottom-nav items per mobile UX best practice; Analytics is reachable via Dashboard quick action.
