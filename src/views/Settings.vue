<script>
import { useDataStore } from '../stores';

export default {
  name: 'Settings',
  data() {
    return {
      activeTab: 'profile', tabs: [
        { id: 'profile', label: 'Profile', icon: 'bi bi-person' },
        { id: 'account', label: 'Account', icon: 'bi bi-info-circle' }
      ],
      profileForm: {
        username: '',
        email: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      profileLoading: false,
      passwordLoading: false,
      profileMessage: '',
      passwordMessage: '',
      profileMessageType: '',
      passwordMessageType: '',
      originalProfile: null,
      store: useDataStore()
    };
  },
  computed: {

    userProfile() {
      return this.store.userProfile;
    },

    profileFormChanged() {
      if (!this.originalProfile) return false;
      return (
        this.profileForm.username !== this.originalProfile.username ||
        this.profileForm.email !== this.originalProfile.email
      );
    },

    passwordMismatch() {
      return (
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword !== this.passwordForm.confirmPassword
      );
    },

    passwordFormValid() {
      return (
        this.passwordForm.currentPassword &&
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword.length >= 6
      );
    }
  },

  async mounted() {
    await this.loadUserProfile();
  },
  methods: {

    async loadUserProfile() {
      try {
        await this.store.fetchUserProfile();
        if (this.userProfile) {
          this.profileForm.username = this.userProfile.username;
          this.profileForm.email = this.userProfile.email;
          this.originalProfile = { ...this.userProfile };
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        this.showProfileMessage('Failed to load profile information', 'error');
      }
    },

    async updateProfile() {
      if (!this.profileFormChanged) return;

      this.profileLoading = true;
      this.profileMessage = '';

      try {
        await this.store.updateUserProfile({
          username: this.profileForm.username,
          email: this.profileForm.email
        });

        this.originalProfile = { ...this.profileForm };
        this.showProfileMessage('Profile updated successfully!', 'success');
      } catch (error) {
        console.error('Failed to update profile:', error);
        const errorMessage = error.response?.data?.error || 'Failed to update profile';
        this.showProfileMessage(errorMessage, 'error');
      } finally {
        this.profileLoading = false;
      }
    },

    async changePassword() {
      if (!this.passwordFormValid || this.passwordMismatch) return;

      this.passwordLoading = true;
      this.passwordMessage = '';

      try {
        await this.store.updateUserProfile({
          currentPassword: this.passwordForm.currentPassword,
          newPassword: this.passwordForm.newPassword
        });

        // Clear form on success
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        this.showPasswordMessage('Password changed successfully!', 'success');
      } catch (error) {
        console.error('Failed to change password:', error);
        const errorMessage = error.response?.data?.error || 'Failed to change password';
        this.showPasswordMessage(errorMessage, 'error');
      } finally {
        this.passwordLoading = false;
      }
    },

    showProfileMessage(message, type) {
      this.profileMessage = message;
      this.profileMessageType = type;
      setTimeout(() => {
        this.profileMessage = '';
      }, 5000);
    },

    showPasswordMessage(message, type) {
      this.passwordMessage = message;
      this.passwordMessageType = type;
      setTimeout(() => {
        this.passwordMessage = '';
      }, 5000);
    },

    formatDate(dateString, format = 'long') {
      if (!dateString) return '';

      const date = new Date(dateString);
      const now = new Date();

      if (format === 'short') {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        });
      } else if (format === 'relative') {
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
};
</script>

<template>
  <div class="settings-container">
    <!-- Header moderno con avatar y stats -->
    <div class="settings-header">
      <div class="user-profile-card">
        <div class="profile-avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="profile-info">
          <h1>{{ userProfile?.username || 'User' }}</h1>
          <p class="profile-subtitle">{{ userProfile?.email || 'Loading...' }}</p>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formatDate(userProfile?.createdAt, 'short') || '...' }}</span>
              <span class="stat-label">Member since</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ formatDate(userProfile?.updatedAt, 'relative') || '...' }}</span>
              <span class="stat-label">Last updated</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation tabs -->
    <div class="settings-navigation">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['nav-tab', { active: activeTab === tab.id }]">
        <i :class="tab.icon"></i>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Content based on active tab -->
    <div class="settings-content">
      <!-- Profile Tab -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="content-grid">
          <!-- Profile Information -->
          <div class="settings-card primary">
            <div class="card-header">
              <div class="card-icon">
                <i class="bi bi-person-gear"></i>
              </div>
              <div>
                <h3>Profile Information</h3>
                <p>Update your personal details</p>
              </div>
            </div>

            <form @submit.prevent="updateProfile" class="card-content">
              <div class="input-group">
                <label for="username">Username</label>
                <div class="input-wrapper">
                  <i class="bi bi-person"></i>
                  <input id="username" v-model="profileForm.username" type="text" :disabled="profileLoading" required
                    minlength="3" maxlength="50" placeholder="Enter your username" />
                </div>
              </div>

              <div class="input-group">
                <label for="email">Email Address</label>
                <div class="input-wrapper">
                  <i class="bi bi-envelope"></i>
                  <input id="email" v-model="profileForm.email" type="email" :disabled="profileLoading" required
                    placeholder="Enter your email" />
                </div>
              </div>

              <div class="card-actions">
                <button type="submit" :disabled="profileLoading || !profileFormChanged" class="btn-primary">
                  <i class="bi bi-check-circle" v-if="!profileLoading"></i>
                  <i class="bi bi-arrow-clockwise spin" v-else></i>
                  {{ profileLoading ? 'Updating...' : 'Save Changes' }}
                </button>
              </div>

              <div v-if="profileMessage" :class="['alert', profileMessageType]">
                <i
                  :class="profileMessageType === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'"></i>
                {{ profileMessage }}
              </div>
            </form>
          </div>

          <!-- Security Card -->
          <div class="settings-card secondary">
            <div class="card-header">
              <div class="card-icon danger">
                <i class="bi bi-shield-lock"></i>
              </div>
              <div>
                <h3>Security</h3>
                <p>Manage your password</p>
              </div>
            </div>

            <form @submit.prevent="changePassword" class="card-content">
              <div class="input-group">
                <label for="currentPassword">Current Password</label>
                <div class="input-wrapper">
                  <i class="bi bi-lock"></i>
                  <input id="currentPassword" v-model="passwordForm.currentPassword" type="password"
                    :disabled="passwordLoading" required placeholder="Enter current password" />
                </div>
              </div>

              <div class="input-group">
                <label for="newPassword">New Password</label>
                <div class="input-wrapper">
                  <i class="bi bi-key"></i>
                  <input id="newPassword" v-model="passwordForm.newPassword" type="password" :disabled="passwordLoading"
                    required minlength="6" placeholder="Enter new password" />
                </div>
              </div>

              <div class="input-group">
                <label for="confirmPassword">Confirm Password</label>
                <div class="input-wrapper">
                  <i class="bi bi-check2-circle"></i>
                  <input id="confirmPassword" v-model="passwordForm.confirmPassword" type="password"
                    :disabled="passwordLoading" required minlength="6" placeholder="Confirm new password" />
                </div>
              </div>

              <div v-if="passwordMismatch" class="alert error">
                <i class="bi bi-exclamation-triangle-fill"></i>
                Passwords do not match
              </div>

              <div class="card-actions">
                <button type="submit" :disabled="passwordLoading || passwordMismatch || !passwordFormValid"
                  class="btn-danger">
                  <i class="bi bi-shield-check" v-if="!passwordLoading"></i>
                  <i class="bi bi-arrow-clockwise spin" v-else></i>
                  {{ passwordLoading ? 'Changing...' : 'Change Password' }}
                </button>
              </div>

              <div v-if="passwordMessage" :class="['alert', passwordMessageType]">
                <i
                  :class="passwordMessageType === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'"></i>
                {{ passwordMessage }}
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Account Tab -->
      <div v-if="activeTab === 'account'" class="tab-content">
        <div class="content-grid">
          <div class="settings-card">
            <div class="card-header">
              <div class="card-icon">
                <i class="bi bi-info-circle"></i>
              </div>
              <div>
                <h3>Account Information</h3>
                <p>View your account details</p>
              </div>
            </div>

            <div class="card-content">
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-icon">
                    <i class="bi bi-hash"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">User ID</span>
                    <span class="info-value">{{ userProfile?.id || 'Loading...' }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <div class="info-icon">
                    <i class="bi bi-calendar-plus"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Created</span>
                    <span class="info-value">{{ formatDate(userProfile?.createdAt) || 'Loading...' }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <div class="info-icon">
                    <i class="bi bi-arrow-clockwise"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Last Updated</span>
                    <span class="info-value">{{ formatDate(userProfile?.updatedAt) || 'Loading...' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="settings-card secondary">
            <div class="card-header">
              <div class="card-icon">
                <i class="bi bi-lightning"></i>
              </div>
              <div>
                <h3>Quick Actions</h3>
                <p>Common tasks and shortcuts</p>
              </div>
            </div>

            <div class="card-content">
              <div class="action-list">
                <button class="action-button" @click="$router.push('/projects')">
                  <i class="bi bi-kanban"></i>
                  <span>View Projects</span>
                  <i class="bi bi-arrow-right"></i>
                </button>

                <button class="action-button" @click="$router.push('/my-tasks')">
                  <i class="bi bi-check2-square"></i>
                  <span>My Tasks</span>
                  <i class="bi bi-arrow-right"></i>
                </button>

                <button class="action-button" @click="$router.push('/reports')">
                  <i class="bi bi-bar-chart"></i>
                  <span>View Reports</span>
                  <i class="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css");

/* Container principal */
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 80vh;
}

/* Header moderno con perfil de usuario */
.settings-header {
  margin-bottom: 3rem;
}

.user-profile-card {
  background: linear-gradient(135deg, #185a9d 0%, #43cea2 100%);
  border-radius: 24px;
  padding: 2rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 20px 40px rgba(24, 90, 157, 0.3);
  position: relative;
  overflow: hidden;
}

.user-profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30%, -30%);
}

.profile-avatar {
  font-size: 5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
}

.profile-info h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 1.5rem 0;
  font-weight: 300;
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

/* Navigation tabs moderna */
.settings-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 0.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(67, 206, 162, 0.1);
}

.nav-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.nav-tab:hover {
  background: rgba(67, 206, 162, 0.05);
  color: #185a9d;
  transform: translateY(-1px);
}

.nav-tab.active {
  background: linear-gradient(135deg, #185a9d 0%, #43cea2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(24, 90, 157, 0.3);
}

.nav-tab i {
  font-size: 1.1rem;
}

/* Content area */
.settings-content {
  min-height: 500px;
}

.tab-content {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Grid layouts */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.content-grid.single {
  grid-template-columns: 1fr;
}

/* Cards modernas */
.settings-card {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(67, 206, 162, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.settings-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
}

.settings-card.primary {
  border-left: 4px solid #43cea2;
}

.settings-card.secondary {
  border-left: 4px solid #185a9d;
}

.card-header {
  padding: 2rem 2rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.card-icon.danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #185a9d;
  margin: 0 0 0.25rem 0;
}

.card-header p {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.card-content {
  padding: 0 2rem 2rem;
}

/* Form styles modernos */
.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  color: #185a9d;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  font-size: 1rem;
  z-index: 1;
}

.input-wrapper input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
  background: #f9fafb;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #43cea2;
  background: white;
  box-shadow: 0 0 0 4px rgba(67, 206, 162, 0.1);
  transform: translateY(-1px);
}

.input-wrapper input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

/* Buttons */
.card-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.btn-primary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #369870 0%, #43cea2 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 206, 162, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.btn-primary:disabled,
.btn-danger:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading animation */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 1rem;
}

.alert.success {
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, rgba(67, 206, 162, 0.05) 100%);
  color: #166534;
  border: 1px solid rgba(67, 206, 162, 0.2);
}

.alert.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.2);
}



/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.info-card:hover {
  background: white;
  border-color: #43cea2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #185a9d;
}

/* Action buttons */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  font-size: 0.95rem;
  font-weight: 500;
}

.action-button:hover {
  background: white;
  border-color: #43cea2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: #185a9d;
}

.action-button i:first-child {
  color: #43cea2;
  font-size: 1.1rem;
}

.action-button i:last-child {
  color: #6b7280;
  transition: transform 0.3s ease;
}

.action-button:hover i:last-child {
  transform: translateX(4px);
}

/* Responsive design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .user-profile-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .profile-info h1 {
    font-size: 2rem;
  }

  .profile-stats {
    justify-content: center;
  }

  .settings-navigation {
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-tab {
    justify-content: flex-start;
    padding: 0.875rem 1rem;
  }

  .card-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .card-content {
    padding: 0 1.5rem 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark mode */
body.dark-mode .settings-card {
  background: #1f2937;
  border-color: #374151;
}

body.dark-mode .settings-navigation {
  background: #1f2937;
  border-color: #374151;
}

body.dark-mode .nav-tab {
  color: #9ca3af;
}

body.dark-mode .nav-tab:hover {
  background: rgba(67, 206, 162, 0.1);
  color: #43cea2;
}

body.dark-mode .input-wrapper input {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

body.dark-mode .input-wrapper input:focus {
  background: #4b5563;
  border-color: #43cea2;
}

body.dark-mode .info-card,
body.dark-mode .action-button {
  background: #374151;
  border-color: #4b5563;
}

body.dark-mode .info-card:hover,
body.dark-mode .action-button:hover {
  background: #4b5563;
  border-color: #43cea2;
}

body.dark-mode .card-header h3,
body.dark-mode .info-value {
  color: #f9fafb;
}

body.dark-mode .card-header p,
body.dark-mode .info-label {
  color: #d1d5db;
}
</style>