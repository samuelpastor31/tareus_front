<script>
import TaskComments from './TaskComments.vue';
import EditTaskModal from './EditTaskModal.vue';

export default {
  name: 'TaskItem',
  components: {
    TaskComments,
    EditTaskModal,
  },
  props: {
    task: {
      type: Object,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    projectUsers: {
      type: Array,
      default: () => [],
    },
    showRemoveButton: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      showComments: false,
      showEditModal: false,
      isDragging: false,
      isDragStart: false,
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

    getAssignedUserName(userId) {
      if (!userId) return 'Unassigned';
      const user = this.projectUsers.find(u => u.id === userId);
      return user ? (user.username || user.email) : 'Unknown User';
    },

    openComments(event) {
      // Prevent drag and drop conflicts
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.showComments = true;
    },

    handleCardClick(event) {
      // Only open comments if not clicking on interactive elements and not dragging
      const target = event.target;
      const isInteractiveElement = target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('select') ||
        target.closest('button') ||
        target.closest('.custom-select-wrapper') ||
        target.closest('.remove-task-btn');

      // Don't open comments if dragging or if clicking on interactive elements
      if (!isInteractiveElement && !this.isDragging) {
        this.openComments(event);
      }
    },

    handleMouseDown(event) {
      // Mark that we might be starting a drag
      this.isDragStart = true;
      this.isDragging = false;

      // Don't interfere with drag and drop for interactive elements
      const target = event.target;
      const isInteractiveElement = target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('select') ||
        target.closest('button') ||
        target.closest('.custom-select-wrapper') ||
        target.closest('.remove-task-btn');

      if (isInteractiveElement) {
        event.stopPropagation();
      }
    },

    handleDragStart(event) {
      this.isDragging = true;
      // Allow drag and drop to work normally
    },

    handleDragEnd() {
      // Reset drag state after a short delay to prevent click after drag
      setTimeout(() => {
        this.isDragging = false;
        this.isDragStart = false;
      }, 100);
    },

    closeComments() {
      this.showComments = false;
    },

    editTask() {
      if (!this.canEdit) return;
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
    },

    handleTaskUpdated(updatedTask) {
      this.$emit('task-updated', updatedTask);
      this.closeEditModal();
    },

    async updateTaskPriority(newPriority) {
      if (!this.canEdit) return;

      try {
        this.$emit('update-priority', this.task.id, newPriority);
      } catch (error) {
        console.error('Error updating task priority:', error);
      }
    },

    async updateTaskStatus(newStatus) {
      if (!this.canEdit) return;

      try {
        this.$emit('update-status', this.task.id, newStatus);
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    },

    async updateTaskAssignedUser(newUserId) {
      if (!this.canEdit) return;

      try {
        this.$emit('update-assigned-user', this.task.id, newUserId);
      } catch (error) {
        console.error('Error updating task assigned user:', error);
      }
    }
  }
};
</script>

<template>
  <div class="task-card" @click="handleCardClick" @mousedown="handleMouseDown" @dragstart="handleDragStart"
    @dragend="handleDragEnd">
    <!-- Remove button (X) - only shown in slot content context -->
    <button v-if="showRemoveButton" @click="$emit('remove-task')" class="remove-task-btn" title="Remove from card"
      @mousedown.stop @dragstart.prevent>
      ×
    </button>

    <!-- Normal task view -->
    <div class="task-header">
      <span class="task-title">Title: {{ task.title }}</span>
      <span class="task-id">#ID: {{ task.id }}</span>
    </div>
    <div class="task-desc">Description: {{ task.description }}</div>
    <div class="task-info">
      <span class="task-status">
        <strong>Status:</strong>
        <div v-if="canEdit" class="custom-select-wrapper">
          <select :value="task.status || 'pending'" @change="updateTaskStatus($event.target.value)"
            :class="['custom-select', 'status-select', `status-${task.status}`]">
            <option value="pending" class="status-option-pending">🟡 Pending</option>
            <option value="in_progress" class="status-option-progress">🔵 In Progress</option>
            <option value="completed" class="status-option-completed">🟢 Completed</option>
          </select>
        </div>
        <span v-else :class="`status-${task.status}`">
          {{ formatStatus(task.status) }}
        </span>
      </span>
      <span class="task-priority">
        <strong>Priority:</strong>
        <div v-if="canEdit" class="custom-select-wrapper">
          <select :value="task.priority || 'low'" @change="updateTaskPriority($event.target.value)"
            :class="['custom-select', 'priority-select', `priority-${task.priority}`]">
            <option value="low" class="priority-option-low">🟢 Low</option>
            <option value="medium" class="priority-option-medium">🟡 Medium</option>
            <option value="high" class="priority-option-high">🔴 High</option>
          </select>
        </div>
        <span v-else :class="`priority-${task.priority}`">
          {{ capitalize(task.priority || 'low') }}
        </span>
      </span>
      <span class="task-assigned">
        <strong>Assigned to:</strong>
        <select v-if="canEdit" :value="task.assigned_user_id || ''"
          @change="updateTaskAssignedUser($event.target.value || null)" class="inline-select assigned-select">
          <option value="">Unassigned</option>
          <option v-for="user in projectUsers" :key="user.id" :value="user.id">
            {{ user.username || user.email }}
          </option>
        </select>
        <span v-else class="assigned-user">
          {{ getAssignedUserName(task.assigned_user_id) }}
        </span>
      </span>
    </div>

    <div class="task-actions">
      <button v-if="canEdit" @click="editTask" class="action-btn edit-btn" title="Edit task" @mousedown.stop
        @dragstart.prevent>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span>Edit</span>
      </button>
      <div class="click-hint">
        <span>💬 Click anywhere to view details & comments</span>
      </div>
    </div>

    <!-- Slot for additional content (like remove button) -->
    <slot></slot>

    <!-- Use Teleport to render modals at body level to avoid z-index issues -->
    <Teleport to="body">
      <TaskComments :task-id="task.id" :task="task" :project-users="projectUsers" :is-visible="showComments"
        :can-edit="canEdit" @close="closeComments" />
      <EditTaskModal :is-visible="showEditModal" :task="task" :project-users="projectUsers"
        @task-updated="handleTaskUpdated" @close="closeEditModal" />
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

.remove-task-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 2;
  line-height: 1;
}

.task-card:hover .remove-task-btn {
  opacity: 1;
}

.remove-task-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  transform: scale(1.1);
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
.task-priority,
.task-assigned {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-status strong,
.task-priority strong,
.task-assigned strong {
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
  gap: 0.5rem;
}

.action-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #185a9d;
  border: 1px solid rgba(67, 206, 162, 0.3);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  min-height: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  border-color: #43cea2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.3);
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.click-hint {
  flex: 1;
  text-align: right;
}

.click-hint span {
  font-size: 0.75rem;
  color: #999;
  font-style: italic;
  opacity: 0.8;
}

.comments-btn:hover {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  border-color: #185a9d;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #f9a825 0%, #f57c00 100%);
  border-color: #f9a825;
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

/* Custom select wrapper for better styling */
.custom-select-wrapper {
  margin-left: 0.75rem;
}

.custom-select {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 0.8rem;
  padding-right: 2rem;
}

.custom-select:hover {
  border-color: #43cea2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.15);
}

.custom-select:focus {
  outline: none;
  border-color: #185a9d;
  box-shadow: 0 0 0 3px rgba(24, 90, 157, 0.1);
  transform: translateY(-1px);
}

.status-select {
  min-width: 120px;
}

.priority-select {
  min-width: 100px;
}

.assigned-select {
  min-width: 120px;
}

/* Enhanced status-based coloring for select options with emojis */
.status-option-pending,
.status-select option[value="pending"] {
  color: #f9a825 !important;
  background-color: rgba(249, 168, 37, 0.1) !important;
}

.status-option-progress,
.status-select option[value="in_progress"] {
  color: #185a9d !important;
  background-color: rgba(24, 90, 157, 0.1) !important;
}

.status-option-completed,
.status-select option[value="completed"] {
  color: #43cea2 !important;
  background-color: rgba(67, 206, 162, 0.1) !important;
}

.priority-option-high,
.priority-select option[value="high"] {
  color: #e74c3c !important;
  background-color: rgba(231, 76, 60, 0.1) !important;
}

.priority-option-medium,
.priority-select option[value="medium"] {
  color: #f9a825 !important;
  background-color: rgba(249, 168, 37, 0.1) !important;
}

.priority-option-low,
.priority-select option[value="low"] {
  color: #43cea2 !important;
  background-color: rgba(67, 206, 162, 0.1) !important;
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

  .inline-select {
    margin-left: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
