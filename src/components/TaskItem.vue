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
  }, data() {
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
    openComments() {
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
    }, async saveTask() {
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
        alert('Error updating task');
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
          <span :class="'status-' + (task.status || 'pending')">
            {{ formatStatus(task.status) }}
          </span>
        </span>
        <span v-if="task.priority" class="task-priority">
          <strong>Priority:</strong>
          <span :class="'priority-' + task.priority">{{ capitalize(task.priority) }}</span>
        </span>
      </div>
      <div class="task-actions">
        <button @click="openComments" class="comments-btn" title="View comments">
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
          <select v-model="editedTask.priority" class="form-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="form-group">
          <label>Status:</label>
          <select v-model="editedTask.status" class="form-select">
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
      </div>
    </div>
    <TaskComments :task-id="task.id" :is-visible="showComments" @close="closeComments" />
  </div>
</template>

<style scoped>
.task-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.08);
  padding: 1rem 1.2rem;
  cursor: grab;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.18s;
  min-width: 220px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-card:active {
  cursor: grabbing;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-title {
  font-weight: bold;
  color: #185a9d;
  font-size: 1.1rem;
}

.task-id {
  font-size: 0.92rem;
  color: #aaa;
}

.task-desc {
  font-size: 0.98rem;
  color: #555;
  margin-bottom: 0.2rem;
  margin-top: 0.2rem;
}

.task-info {
  display: flex;
  gap: 1.2rem;
  font-size: 0.92rem;
  color: #666;
  align-items: center;
}

.task-actions {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.comments-btn {
  background: #185a9d;
  color: white;
  border: none;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  min-width: 32px;
  height: 32px;
}

.comments-btn:hover {
  background: #14486d;
}

.edit-btn {
  background: #f9a825;
  color: white;
  border: none;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  min-width: 32px;
  height: 32px;
  margin-left: 0.5rem;
}

.edit-btn:hover {
  background: #f57c00;
}

.status-pending {
  color: #bfa600;
}

.status-in_progress,
.status-in-progress {
  color: #1e90ff;
}

.status-completed {
  color: #43cea2;
}

.priority-high {
  color: #d32f2f;
  font-weight: bold;
}

.priority-medium {
  color: #f9a825;
}

.priority-low {
  color: #388e3c;
}

/* Edit form styles */
.edit-form {
  padding: 0.5rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #333;
  font-size: 0.9rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #185a9d;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.save-btn {
  background: #43cea2;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  flex: 1;
}

.save-btn:hover:not(:disabled) {
  background: #369870;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #666;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  flex: 1;
}

.cancel-btn:hover {
  background: #555;
}

.task-actions {
  display: flex;
  align-items: center;
}
</style>
