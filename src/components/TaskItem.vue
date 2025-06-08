<script>
import TaskComments from './TaskComments.vue';

export default {
  name: 'TaskItem',
  components: {
    TaskComments,
  },
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showComments: false,
      isEditing: false,
      editedTask: {
        title: '',
        description: '',
        priority: '',
        status: ''
      }
    };
  },
 methods: {
    formatStatus(status) {
      if (status === 'pending') return 'Pending';
      if (status === 'in_progress' || status === 'in-progress') return 'In Progress';
      if (status === 'completed') return 'Completed';
      return status || 'Pending';
    },
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    openComments(event) {
      // Prevent drag and drop conflicts
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.showComments = true;
    },
    closeComments() {
      this.showComments = false;
    },
    editTask() {
      this.isEditing = true;
      this.editedTask = {
        title: this.task.title,
        description: this.task.description,
        priority: this.task.priority || '',
        status: this.task.status || 'pending'
      };
    },

    async saveTask() {
      try {
        const updatedTask = {
          id: this.task.id,
          title: this.editedTask.title,
          description: this.editedTask.description,
          priority: this.editedTask.priority || null,
          status: this.editedTask.status
        };

        this.$emit('task-updated', updatedTask);
        this.isEditing = false;
      } catch (error) {
        console.error('Error updating task:', error);
      }
    },

    cancelEdit() {
      this.isEditing = false;
      this.editedTask = {
        title: '',
        description: '',
        priority: '',
        status: ''
      };
    },

    async updateTaskPriority(newPriority) {
      try {
        this.$emit('update-priority', this.task.id, newPriority);
      } catch (error) {
        console.error('Error updating task priority:', error);
      }
    },

    async updateTaskStatus(newStatus) {
      try {
        this.$emit('update-status', this.task.id, newStatus);
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    }
  }
};
</script>

<template>
  <div class="task-card">
    <!-- Normal task view -->
    <div v-if="!isEditing">
      <div class="task-header">
        <span class="task-title">Title: {{ task.title }}</span>
        <span class="task-id">#ID: {{ task.id }}</span>
      </div>
      <div class="task-desc">Description: {{ task.description }}</div>
      <div class="task-info">
        <span class="task-status">
          <strong>Status:</strong>
          <select 
            :value="task.status || 'pending'" 
            @change="updateTaskStatus($event.target.value)"
            :class="['inline-select', 'status-select', `status-${task.status}`]"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </span>
        <span class="task-priority">
          <strong>Priority:</strong>
          <select 
            :value="task.priority || 'low'" 
            @change="updateTaskPriority($event.target.value)"
            :class="['inline-select', 'priority-select', `priority-${task.priority}`]"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </span>
      </div>
      <div class="task-actions">
        <button @click="openComments($event)" class="comments-btn" title="View comments" 
                @mousedown.stop @dragstart.prevent>
          💬
        </button>
        <button @click="editTask" class="edit-btn" title="Edit task">
          ✏️
        </button>
      </div>
    </div> <!-- Edit form -->
    <div v-else class="edit-form">
      <div class="task-header">
        <span class="task-id">#ID: {{ task.id }}</span>
      </div>
      <div class="form-group">
        <label>Title:</label>
        <input v-model="editedTask.title" type="text" class="form-input" placeholder="Task title" required />
      </div>

      <div class="form-group">
        <label>Description:</label>
        <textarea v-model="editedTask.description" class="form-textarea" placeholder="Task description" rows="3"
          required></textarea>
      </div>
 <div class="form-row">
        <div class="form-group">
          <label>Priority:</label>
          <select v-model="editedTask.priority" :class="['form-select', `priority-${editedTask.priority}`]">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="form-group">
          <label>Status:</label>
          <select v-model="editedTask.status" :class="['form-select', `status-${editedTask.status}`]">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div class="edit-actions">
        <button @click="saveTask" class="save-btn"
          :disabled="!editedTask.title.trim() || !editedTask.description.trim()">
          💾 Save
        </button>
        <button @click="cancelEdit" class="cancel-btn">
          ❌ Cancel
        </button>
      </div>    </div>
    <!-- Use Teleport to render modal at body level to avoid z-index issues -->
    <Teleport to="body">
      <TaskComments :task-id="task.id" :is-visible="showComments" @close="closeComments" />
    </Teleport>
  </div>
</template>

<style scoped>
.task-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.12);
  padding: 1.25rem 1.5rem;
  cursor: grab;
  border: 1px solid rgba(67, 206, 162, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  border-radius: 12px 12px 0 0;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(24, 90, 157, 0.2);
  border-color: rgba(67, 206, 162, 0.3);
}

.task-card:active {
  cursor: grabbing;
  transform: translateY(-1px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
}

.task-title {
  font-weight: 700;
  color: #185a9d;
  font-size: 1.15rem;
  letter-spacing: 0.3px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.task-id {
  font-size: 0.85rem;
  color: #999;
  background: rgba(67, 206, 162, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.task-desc {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 0.25rem;
  margin-top: 0.5rem;
  line-height: 1.5;
  background: rgba(245, 247, 250, 0.8);
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 3px solid rgba(67, 206, 162, 0.3);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #666;
  padding: 0.5rem 0;
}

.task-status,
.task-priority {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-status strong,
.task-priority strong {
  font-weight: 600;
  color: #185a9d;
  font-size: 0.85rem;
}

.task-actions {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(67, 206, 162, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.comments-btn {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-width: 36px;
  height: 36px;
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.2);
}

.comments-btn:hover {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 90, 157, 0.3);
}

.edit-btn {
  background: linear-gradient(135deg, #f9a825 0%, #f57c00 100%);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-width: 36px;
  height: 36px;
  box-shadow: 0 2px 8px rgba(249, 168, 37, 0.2);
}

.edit-btn:hover {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 168, 37, 0.3);
}

/* Enhanced status and priority colors */
.status-pending {
  color: #f9a825;
  font-weight: 600;
}

.status-in_progress,
.status-in-progress {
  color: #185a9d;
  font-weight: 600;
}

.status-completed {
  color: #43cea2;
  font-weight: 600;
}

.priority-high {
  color: #e74c3c;
  font-weight: 700;
}

.priority-medium {
  color: #f9a825;
  font-weight: 600;
}

.priority-low {
  color: #43cea2;
  font-weight: 600;
}

/* Edit form styles */
.edit-form {
  padding: 0.75rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  margin: 0.5rem 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #185a9d;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
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
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.edit-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(67, 206, 162, 0.15);
}

.save-btn {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.2);
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.3);
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background: linear-gradient(135deg, #666 0%, #555 100%);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(102, 102, 102, 0.2);
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 102, 102, 0.3);
}

.task-actions {
  display: flex;
  align-items: center;
}

/* Enhanced inline select styles */
.inline-select {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.inline-select:hover {
  border-color: #43cea2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.15);
}

.inline-select:focus {
  outline: none;
  border-color: #185a9d;
  box-shadow: 0 0 0 3px rgba(24, 90, 157, 0.1);
  transform: translateY(-1px);
}

.status-select {
  min-width: 110px;
}

.priority-select {
  min-width: 90px;
}

/* Enhanced status-based coloring for select options */
.status-select option[value="pending"] {
  color: #f9a825;
  background: rgba(249, 168, 37, 0.1);
}

.status-select option[value="in_progress"] {
  color: #185a9d;
  background: rgba(24, 90, 157, 0.1);
}

.status-select option[value="completed"] {
  color: #43cea2;
  background: rgba(67, 206, 162, 0.1);
}

.priority-select option[value="high"] {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.priority-select option[value="medium"] {
  color: #f9a825;
  background: rgba(249, 168, 37, 0.1);
}

.priority-select option[value="low"] {
  color: #43cea2;
  background: rgba(67, 206, 162, 0.1);
}

/* Dynamic coloring for selected status values */
.status-select.status-pending {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.1) 0%, rgba(249, 168, 37, 0.05) 100%);
  border-color: rgba(249, 168, 37, 0.3);
  font-weight: 600;
}

.status-select.status-in_progress {
  color: #185a9d;
  background: linear-gradient(135deg, rgba(24, 90, 157, 0.1) 0%, rgba(24, 90, 157, 0.05) 100%);
  border-color: rgba(24, 90, 157, 0.3);
  font-weight: 600;
}

.status-select.status-completed {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, rgba(67, 206, 162, 0.05) 100%);
  border-color: rgba(67, 206, 162, 0.3);
  font-weight: 600;
}

/* Dynamic coloring for selected priority values */
.priority-select.priority-high {
  color: #e74c3c;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%);
  border-color: rgba(231, 76, 60, 0.3);
  font-weight: 700;
}

.priority-select.priority-medium {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.1) 0%, rgba(249, 168, 37, 0.05) 100%);
  border-color: rgba(249, 168, 37, 0.3);
  font-weight: 600;
}

.priority-select.priority-low {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, rgba(67, 206, 162, 0.05) 100%);
  border-color: rgba(67, 206, 162, 0.3);
  font-weight: 600;
}

/* Dynamic coloring for form selects */
.form-select.status-pending {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.08) 0%, #ffffff 100%);
  border-color: rgba(249, 168, 37, 0.4);
  font-weight: 600;
}

.form-select.status-in_progress {
  color: #185a9d;
  background: linear-gradient(135deg, rgba(24, 90, 157, 0.08) 0%, #ffffff 100%);
  border-color: rgba(24, 90, 157, 0.4);
  font-weight: 600;
}

.form-select.status-completed {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.08) 0%, #ffffff 100%);
  border-color: rgba(67, 206, 162, 0.4);
  font-weight: 600;
}

.form-select.priority-high {
  color: #e74c3c;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.08) 0%, #ffffff 100%);
  border-color: rgba(231, 76, 60, 0.4);
  font-weight: 700;
}

.form-select.priority-medium {
  color: #f9a825;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.08) 0%, #ffffff 100%);
  border-color: rgba(249, 168, 37, 0.4);
  font-weight: 600;
}

.form-select.priority-low {
  color: #43cea2;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.08) 0%, #ffffff 100%);
  border-color: rgba(67, 206, 162, 0.4);
  font-weight: 600;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .task-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 0;
  }
  
  /* For unassigned tasks that need to maintain width for horizontal scrolling */
  .unassigned-task .task-card {
    min-width: 280px;
    max-width: 320px;
    margin: 0 0.5rem;
  }
  
  .task-info {
    gap: 0.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .edit-actions {
    flex-direction: column;
  }
  
  .inline-select {
    margin-left: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
