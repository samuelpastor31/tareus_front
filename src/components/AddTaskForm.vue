<script>
export default {
  name: 'AddTaskForm',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    cardId: {
      type: [Number, String, null],
      default: null
    },
    cardName: {
      type: String,
      default: ''
    },
    projectUsers: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      title: '',
      description: '',
      priority: '',
      status: '',
      assigned_user_id: null
    };
  },
  emits: ['add-task', 'close'],
  methods: {
    submitTask() {
      if (!this.title.trim() || !this.description.trim()) return;

      this.$emit('add-task', {
        title: this.title,
        description: this.description,
        priority: this.priority || undefined,
        status: this.status || undefined,
        cardId: this.cardId,
        assigned_user_id: this.assigned_user_id || undefined
      });

      this.resetForm();
    },
    resetForm() {
      this.title = '';
      this.description = '';
      this.priority = '';
      this.status = '';
      this.assigned_user_id = null;
    },
    closeModal() {
      this.resetForm();
      this.$emit('close');
    },
    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.closeModal();
      }
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        // Focus on first input
        this.$nextTick(() => {
          const titleInput = this.$refs.titleInput;
          if (titleInput) titleInput.focus();
        });
      } else {
        // Restore body scroll when modal is closed
        document.body.style.overflow = '';
      }
    }
  }
};
</script>

<template>
  <!-- Modal Overlay -->
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
      <div class="add-task-modal" @click.stop>
        <form class="add-task-form" @submit.prevent="submitTask">
          <div class="form-header">
            <h3>✨ Add New Task</h3>
            <p v-if="cardName">Add to: <strong>{{ cardName }}</strong></p>
            <p v-else>Create a new task for your project</p>
            <button type="button" class="close-btn" @click="closeModal" title="Close">
              ✕
            </button>
          </div>

          <div class="form-content">
            <div class="form-row">
              <div class="form-group">
                <label for="title">📝 Task Title</label>
                <input id="title" ref="titleInput" v-model="title" type="text" placeholder="Enter task title..."
                  required class="form-input" />
              </div>

              <div class="form-group">
                <label for="description">📄 Description</label>
                <textarea id="description" v-model="description" placeholder="Describe your task..." required
                  class="form-textarea" rows="3"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="priority">⚡ Priority</label>
                <select id="priority" v-model="priority" :class="['form-select', `priority-${priority}`]">
                  <option value="">Select priority...</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div class="form-group">
                <label for="status">📊 Status</label>
                <select id="status" v-model="status" :class="['form-select', `status-${status}`]">
                  <option value="">Select status...</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">⚙️ In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>

              <div class="form-group">
                <label for="assigned_user">👤 Assigned to</label>
                <select id="assigned_user" v-model="assigned_user_id" class="form-select">
                  <option :value="null">Unassigned</option>                  <option 
                    v-for="user in projectUsers" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.username || user.email }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeModal">
                <span class="btn-icon">❌</span>
                <span class="btn-text">Cancel</span>
              </button>
              <button type="submit" class="submit-btn" :disabled="!title.trim() || !description.trim()">
                <span class="btn-icon">🚀</span>
                <span class="btn-text">Create Task</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal overlay styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  box-sizing: border-box;
  animation: fadeIn 0.3s ease-out;
}

.add-task-modal {
  position: relative;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideInScale 0.4s ease-out;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  color: #666;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.close-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
}

.cancel-btn {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #666;
  border: 2px solid rgba(108, 117, 125, 0.2);
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
  min-width: 140px;
  justify-content: center;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  color: #495057;
  border-color: rgba(108, 117, 125, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.2);
}

.add-task-container {
  margin: 2rem 0;
  padding: 0 1rem;
}

.add-task-form {
  background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(24, 90, 157, 0.15);
  border: 1px solid rgba(67, 206, 162, 0.2);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  max-width: 800px;
  margin: 0 auto;
}

.add-task-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
}

.add-task-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(24, 90, 157, 0.2);
  border-color: rgba(67, 206, 162, 0.4);
}

.form-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e0f7fa 100%);
  padding: 2rem 2rem 1.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(67, 206, 162, 0.1);
  margin-top: 6px;
}

.form-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #185a9d;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(24, 90, 157, 0.1);
}

.form-header p {
  margin: 0;
  color: #666;
  font-size: 1rem;
  opacity: 0.8;
}

.form-content {
  padding: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:first-child {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #185a9d;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  margin-bottom: 0.25rem;
}

.form-input,
.form-textarea,
.form-select {
  padding: 1rem 1.25rem;
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 12px;
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
  outline: none;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #43cea2;
  box-shadow: 0 0 0 4px rgba(67, 206, 162, 0.1);
  transform: translateY(-1px);
}

.form-input:hover,
.form-textarea:hover,
.form-select:hover {
  border-color: rgba(67, 206, 162, 0.4);
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 3rem;
}

/* Dynamic coloring for status and priority selects */
.form-select.status-pending {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.05) 0%, #ffffff 100%);
  border-color: rgba(249, 168, 37, 0.3);
}

.form-select.status-in_progress {
  color: #185a9d;
  background: linear-gradient(135deg, rgba(24, 90, 157, 0.05) 0%, #ffffff 100%);
  border-color: rgba(24, 90, 157, 0.3);
}

.form-select.status-completed {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.05) 0%, #ffffff 100%);
  border-color: rgba(67, 206, 162, 0.3);
}

.form-select.priority-high {
  color: #e74c3c;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.05) 0%, #ffffff 100%);
  border-color: rgba(231, 76, 60, 0.3);
}

.form-select.priority-medium {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.05) 0%, #ffffff 100%);
  border-color: rgba(249, 168, 37, 0.3);
}

.form-select.priority-low {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.05) 0%, #ffffff 100%);
  border-color: rgba(67, 206, 162, 0.3);
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(67, 206, 162, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 16px rgba(67, 206, 162, 0.3);
  letter-spacing: 0.3px;
  min-width: 200px;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(24, 90, 157, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.3);
}

.submit-btn:disabled {
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0.6;
}

.btn-icon {
  font-size: 1.2rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.btn-text {
  font-weight: 700;
}

/* Responsive design */
@media (max-width: 768px) {
  .add-task-container {
    padding: 0 0.5rem;
  }

  .form-content {
    padding: 1.5rem;
  }

  .form-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .form-header h3 {
    font-size: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: 0.875rem 1rem;
    font-size: 0.95rem;
  }

  .submit-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
    min-width: 180px;
  }
}

@media (max-width: 480px) {
  .form-header h3 {
    font-size: 1.3rem;
  }

  .form-header p {
    font-size: 0.9rem;
  }

  .submit-btn {
    width: 100%;
    min-width: unset;
  }
}

/* Focus accessibility improvements */
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: 2px solid #43cea2;
  outline-offset: 2px;
}

/* Animation for form appearance */
.add-task-form {
  animation: slideInUp 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced select option styling */
.form-select option {
  padding: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
}

/* Priority option colors */
.form-select option[value="high"] {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
  font-weight: 700;
}

.form-select option[value="medium"] {
  color: #f9a825;
  background-color: rgba(249, 168, 37, 0.1);
  font-weight: 600;
}

.form-select option[value="low"] {
  color: #43cea2;
  background-color: rgba(67, 206, 162, 0.1);
  font-weight: 600;
}

/* Status option colors */
.form-select option[value="pending"] {
  color: #f9a825;
  background-color: rgba(249, 168, 37, 0.1);
  font-weight: 600;
}

.form-select option[value="in_progress"] {
  color: #185a9d;
  background-color: rgba(24, 90, 157, 0.1);
  font-weight: 600;
}

.form-select option[value="completed"] {
  color: #43cea2;
  background-color: rgba(67, 206, 162, 0.1);
  font-weight: 600;
}

/* Default option styling */
.form-select option[value=""] {
  color: #666;
  background-color: #ffffff;
  font-style: italic;
}

/* Custom scrollbar for textarea */
.form-textarea::-webkit-scrollbar {
  width: 8px;
}

.form-textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.form-textarea::-webkit-scrollbar-thumb {
  background: #43cea2;
  border-radius: 4px;
}

.form-textarea::-webkit-scrollbar-thumb:hover {
  background: #369870;
}
</style>
