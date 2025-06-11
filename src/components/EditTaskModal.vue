<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Edit Task</h3>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="task-id-display">
          <span class="task-id-label">Task ID:</span>
          <span class="task-id-value">#{{ task.id }}</span>
        </div>

        <div class="form-group">
          <label>Title <span class="required">*</span></label>
          <input 
            v-model="editedTask.title" 
            type="text" 
            class="form-input" 
            placeholder="Enter task title"
            required 
          />
        </div>

        <div class="form-group">
          <label>Description <span class="required">*</span></label>
          <textarea 
            v-model="editedTask.description" 
            class="form-textarea" 
            placeholder="Enter task description" 
            rows="4"
            required
          ></textarea>
        </div>        <div class="form-row">
          <div class="form-group">
            <label>Priority</label>
            <select v-model="editedTask.priority" :class="['form-select', `priority-${editedTask.priority}`]">
              <option value="low" class="priority-option-low">🟢 Low</option>
              <option value="medium" class="priority-option-medium">🟡 Medium</option>
              <option value="high" class="priority-option-high">🔴 High</option>
            </select>
          </div>

          <div class="form-group">
            <label>Status</label>
            <select v-model="editedTask.status" :class="['form-select', `status-${editedTask.status}`]">
              <option value="pending" class="status-option-pending">🟡 Pending</option>
              <option value="in_progress" class="status-option-progress">🔵 In Progress</option>
              <option value="completed" class="status-option-completed">🟢 Completed</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Assigned to</label>
          <select v-model="editedTask.assigned_user_id" class="form-select">
            <option :value="null">Unassigned</option>
            <option v-for="user in projectUsers" :key="user.id" :value="user.id">
              {{ user.username || user.email }}
            </option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">
          Cancel
        </button>
        <button 
          @click="saveTask" 
          class="save-btn"
          :disabled="!editedTask.title.trim() || !editedTask.description.trim()"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditTaskModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    task: {
      type: Object,
      required: true,
    },
    projectUsers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      editedTask: {
        title: '',
        description: '',
        priority: '',
        status: '',
        assigned_user_id: null
      }
    };
  },
  watch: {
    isVisible: {
      handler(newVal) {
        if (newVal) {
          this.initializeEditedTask();
          this.$nextTick(() => {
            // Focus the first input when modal opens
            const firstInput = this.$el.querySelector('.form-input');
            if (firstInput) firstInput.focus();
          });
        }
      },
      immediate: true
    },
    task: {
      handler() {
        if (this.isVisible) {
          this.initializeEditedTask();
        }
      },
      deep: true
    }
  },
  methods: {
    initializeEditedTask() {
      this.editedTask = {
        title: this.task.title || '',
        description: this.task.description || '',
        priority: this.task.priority || 'low',
        status: this.task.status || 'pending',
        assigned_user_id: this.task.assigned_user_id || null
      };
    },
    
    saveTask() {
      if (!this.editedTask.title.trim() || !this.editedTask.description.trim()) {
        return;
      }

      const updatedTask = {
        id: this.task.id,
        title: this.editedTask.title.trim(),
        description: this.editedTask.description.trim(),
        priority: this.editedTask.priority || null,
        status: this.editedTask.status,
        assigned_user_id: this.editedTask.assigned_user_id || null
      };

      this.$emit('task-updated', updatedTask);
      this.closeModal();
    },

    closeModal() {
      this.$emit('close');
    }
  },
  mounted() {
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.closeModal();
      }
    });
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(24, 90, 157, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(67, 206, 162, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(67, 206, 162, 0.15);
  background: linear-gradient(135deg, #f8fafc 0%, #e0f7fa 100%);
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #185a9d;
  letter-spacing: 0.5px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.modal-body {
  padding: 2rem;
}

.task-id-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(67, 206, 162, 0.1);
  border-radius: 8px;
  border-left: 4px solid #43cea2;
}

.task-id-label {
  font-weight: 600;
  color: #185a9d;
  font-size: 0.9rem;
}

.task-id-value {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #43cea2;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #185a9d;
  font-size: 0.95rem;
}

.required {
  color: #e74c3c;
  font-weight: 700;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #43cea2;
  box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.1);
  transform: translateY(-1px);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Priority and Status styling */
.priority-high {
  color: #e74c3c;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.08) 0%, #ffffff 100%);
  border-color: rgba(231, 76, 60, 0.4);
  font-weight: 700;
}

.priority-medium {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.08) 0%, #ffffff 100%);
  border-color: rgba(249, 168, 37, 0.4);
  font-weight: 600;
}

.priority-low {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.08) 0%, #ffffff 100%);
  border-color: rgba(67, 206, 162, 0.4);
  font-weight: 600;
}

.status-pending {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.08) 0%, #ffffff 100%);
  border-color: rgba(249, 168, 37, 0.4);
  font-weight: 600;
}

.status-in_progress {
  color: #185a9d;
  background: linear-gradient(135deg, rgba(24, 90, 157, 0.08) 0%, #ffffff 100%);
  border-color: rgba(24, 90, 157, 0.4);
  font-weight: 600;
}

.status-completed {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.08) 0%, #ffffff 100%);
  border-color: rgba(67, 206, 162, 0.4);
  font-weight: 600;
}

/* Enhanced coloring for select options with emojis */
.priority-option-high,
.form-select option[value="high"] {
  color: #e74c3c !important;
  background-color: rgba(231, 76, 60, 0.1) !important;
}

.priority-option-medium,
.form-select option[value="medium"] {
  color: #f9a825 !important;
  background-color: rgba(249, 168, 37, 0.1) !important;
}

.priority-option-low,
.form-select option[value="low"] {
  color: #43cea2 !important;
  background-color: rgba(67, 206, 162, 0.1) !important;
}

.status-option-pending,
.form-select option[value="pending"] {
  color: #f9a825 !important;
  background-color: rgba(249, 168, 37, 0.1) !important;
}

.status-option-progress,
.form-select option[value="in_progress"] {
  color: #185a9d !important;
  background-color: rgba(24, 90, 157, 0.1) !important;
}

.status-option-completed,
.form-select option[value="completed"] {
  color: #43cea2 !important;
  background-color: rgba(67, 206, 162, 0.1) !important;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(67, 206, 162, 0.15);
  background: rgba(248, 255, 254, 0.5);
  border-radius: 0 0 16px 16px;
}

.save-btn {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.3);
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.4);
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #666;
  border: 2px solid rgba(67, 206, 162, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-color: rgba(67, 206, 162, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 102, 102, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    margin: 0.5rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .save-btn,
  .cancel-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
