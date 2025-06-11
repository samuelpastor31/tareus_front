<script>
import { useDataStore } from "../stores/index.js";
import ConfirmModal from './ConfirmModal.vue';

export default {
  name: 'TaskComments',
  components: {
    ConfirmModal,
  },
  props: {
    taskId: {
      type: Number,
      required: true,
    },
    task: {
      type: Object,
      required: true,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    projectUsers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      comments: [],
      newComment: '',
      loading: false,
      editingComment: null,
      editContent: '',
      showDeleteModal: false,
      commentToDelete: null,
    };
  },
  setup() {
    const store = useDataStore();
    return { store };
  },
 watch: {
    isVisible(newVal) {
      if (newVal) {
        this.loadComments();
        // Disable body scroll when modal is open
        document.body.style.overflow = 'hidden';
      } else {
        // Re-enable body scroll when modal is closed
        document.body.style.overflow = '';
      }
    },
  },
  methods: {
 async loadComments() {
      if (!this.taskId) return;

      this.loading = true;
      try {
        this.comments = await this.store.fetchTaskComments(this.taskId);
      } catch (error) {
        console.error('Error loading comments:', error);
        this.comments = [];
      } finally {
        this.loading = false;
      }
    },

    async addComment() {
      if (!this.canEdit) return;
      if (!this.newComment.trim()) return;

      try {
        const newCommentData = await this.store.addComment(this.taskId, this.newComment.trim());
        this.comments.push(newCommentData);
        this.newComment = '';
        this.$emit('comment-added');
      } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error adding comment');
      }
    },

    startEdit(comment) {
      this.editingComment = comment.id;
      this.editContent = comment.content;
    },

    cancelEdit() {
      this.editingComment = null;
      this.editContent = '';
    },

    async saveEdit(commentId) {
      if (!this.editContent.trim()) return;

      try {
        await this.store.updateComment(commentId, this.editContent.trim());
        const commentIndex = this.comments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          this.comments[commentIndex].content = this.editContent.trim();
        }
        this.cancelEdit();
      } catch (error) {
        console.error('Error updating comment:', error);
        alert('Error updating comment');
      }
    }, async deleteComment(commentId) {
      this.commentToDelete = this.comments.find(c => c.id === commentId);
      this.showDeleteModal = true;
    },

    confirmDeleteComment() {
      if (!this.commentToDelete) return;

      this.store.deleteComment(this.commentToDelete.id)
        .then(() => {
          this.comments = this.comments.filter(c => c.id !== this.commentToDelete.id);
          this.cancelDeleteComment();
        })
        .catch((error) => {
          console.error('Error deleting comment:', error);
          alert('Error deleting comment');
          this.cancelDeleteComment();
        });
    },

    cancelDeleteComment() {
      this.showDeleteModal = false;
      this.commentToDelete = null;
    },


    formatDate(dateString) {
      if (!dateString) return 'N/A';

      console.log('Formatting date:', dateString, 'type:', typeof dateString);

      try {
        let date;

        // Handle different date formats
        if (typeof dateString === 'string') {
          // Try parsing the string as ISO date
          date = new Date(dateString);
        } else if (typeof dateString === 'object' && dateString instanceof Date) {
          // Already a Date object
          date = dateString;
        } else {
          console.warn('Unexpected date format:', dateString);
          return 'Invalid Date Format';
        }

        // Check if the date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date after parsing:', dateString);
          return 'Invalid Date';
        }

        const formatted = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        console.log('Successfully formatted date:', formatted);
        return formatted;
      } catch (error) {
        console.error('Error formatting date:', error, 'Input:', dateString);
        return 'Date Error';
      }
    },

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
      console.log('Getting assigned user name for ID:', userId, 'type:', typeof userId);
      console.log('Available users:', this.projectUsers);
      console.log('Task object:', this.task);

      // First check if the task has the AssignedUser relationship object
      if (this.task.AssignedUser) {
        console.log('Found AssignedUser object:', this.task.AssignedUser);
        return this.task.AssignedUser.username || this.task.AssignedUser.email;
      }

      // Fallback to finding user by ID in projectUsers
      if (!userId) return 'Unassigned';
      
      const user = this.projectUsers.find(u => {
        console.log('Comparing user:', u.id, 'with target:', userId, 'types:', typeof u.id, typeof userId);
        return u.id === userId || u.id === parseInt(userId) || parseInt(u.id) === parseInt(userId);
      });
      
      console.log('Found user for assigned:', user);
      return user ? (user.username || user.email) : `Unknown User (ID: ${userId})`;
    },

    getCreatorName(userId) {
      console.log('Getting creator name for ID:', userId, 'type:', typeof userId);
      console.log('Available users:', this.projectUsers);
      console.log('Task object:', this.task);

      // First check if the task has the Creator relationship object
      if (this.task.Creator) {
        console.log('Found Creator object:', this.task.Creator);
        return this.task.Creator.username || this.task.Creator.email;
      }

      // Fallback to finding user by ID in projectUsers
      if (!userId) return 'Unknown Creator';
      
      const user = this.projectUsers.find(u => {
        console.log('Comparing user:', u.id, 'with target:', userId, 'types:', typeof u.id, typeof userId);
        return u.id === userId || u.id === parseInt(userId) || parseInt(u.id) === parseInt(userId);
      });
      
      console.log('Found user for creator:', user);
      return user ? (user.username || user.email) : `Unknown Creator (ID: ${userId})`;
    },
    
    canEditComment(comment) {
      // User can edit if they have edit permission AND are the author of the comment
      if (!this.canEdit) return false;
      
      const currentUserId = localStorage.getItem('user_id');
      return currentUserId && comment.user_id && parseInt(currentUserId) === parseInt(comment.user_id);
    },

    closeComments() {
      this.$emit('close');
    }
  },

  beforeUnmount() {
    // Ensure body scroll is re-enabled if component is destroyed while modal is open
    document.body.style.overflow = '';
  },
};
</script>

<template>
  <div v-if="isVisible" class="comments-overlay" @click="closeComments" @keydown.esc="closeComments">
    <div class="comments-panel" @click.stop @mousedown.stop>
      <div class="comments-header">
        <h3>Task Details & Comments</h3>
        <button @click="closeComments" class="close-btn" type="button">&times;</button>
      </div>

      <!-- Task Information Section -->
      <div class="task-details">
        <div class="task-id-display">
          <span class="task-id-label">Task ID:</span>
          <span class="task-id-value">#{{ task.id }}</span>
        </div>

        <div class="task-field">
          <label class="field-label">Title:</label>
          <div class="field-value task-title">{{ task.title }}</div>
        </div>

        <div class="task-field">
          <label class="field-label">Description:</label>
          <div class="field-value task-description">{{ task.description }}</div>
        </div>

        <div class="task-fields-row">
          <div class="task-field">
            <label class="field-label">Status:</label>
            <div :class="['field-value', 'task-status', `status-${task.status}`]">
              {{ formatStatus(task.status) }}
            </div>
          </div>

          <div class="task-field">
            <label class="field-label">Priority:</label>
            <div :class="['field-value', 'task-priority', `priority-${task.priority}`]">
              {{ capitalize(task.priority || 'low') }}
            </div>
          </div>
        </div>

        <div class="task-fields-row">
          <div class="task-field">
            <label class="field-label">Assigned to:</label>
            <div class="field-value">{{ getAssignedUserName(task.assigned_user_id) }}</div>
          </div>

          <div class="task-field">
            <label class="field-label">Created by:</label>
            <div class="field-value">{{ getCreatorName(task.creator_id) }}</div>
          </div>
        </div>
        <div class="task-fields-row">
          <div class="task-field">
            <label class="field-label">Created:</label>
            <div class="field-value">{{ task.createdAt ? formatDate(task.createdAt) : 'Not available' }}</div>
          </div>

          <div class="task-field">
            <label class="field-label">Last Updated:</label>
            <div class="field-value">{{ task.updatedAt ? formatDate(task.updatedAt) : 'Not available' }}</div>
          </div>
        </div>
      </div>

      <div class="comments-content">
        <!-- comments list -->
        <div v-if="loading" class="loading">Loading comments...</div>

        <div v-else-if="comments.length === 0" class="no-comments">
          No comments yet. Be the first to comment!
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.User?.username || 'User' }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>

            <div v-if="editingComment === comment.id" class="comment-edit">
              <textarea v-model="editContent" class="edit-textarea" rows="3"></textarea>
              <div class="edit-actions">
                <button @click="saveEdit(comment.id)" class="save-btn">💾 Save</button>
                <button @click="cancelEdit" class="cancel-btn">❌ Cancel</button>
              </div>
            </div>

            <div v-else class="comment-content">
              <p>{{ comment.content }}</p>
              <div v-if="canEditComment(comment)" class="comment-actions">
                <button @click="startEdit(comment)" class="edit-btn">✏️ Edit</button>
                <button @click="deleteComment(comment.id)" class="delete-btn">🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="canEdit" class="add-comment">
          <textarea v-model="newComment" placeholder="Write a comment..." class="comment-input" rows="3"
            @keydown.ctrl.enter="addComment"></textarea>
          <button @click="addComment" :disabled="!newComment.trim()" class="add-comment-btn">
            💬 Add Comment
          </button>

        </div>
      </div>
    </div>
    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <confirm-modal :visible="showDeleteModal" title="Confirm Deletion"
        :message="`Are you sure you want to delete this comment?`" confirmText="Delete" cancelText="Cancel"
        :dangerMode="true" @confirm="confirmDeleteComment" @cancel="cancelDeleteComment" />
    </Teleport>
  </div>
</template>

<style scoped>
.comments-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.comments-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transform: scale(1);
  transition: transform 0.2s ease-out;
  z-index: 10000;
  position: relative;
  display: flex;
  flex-direction: column;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.comments-header h3 {
  margin: 0;
  color: #185a9d;
  font-size: 1.3rem;
}

.close-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 2px solid rgba(102, 102, 102, 0.2);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  transition: all 0.3s ease;
  font-weight: bold;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border-color: #e74c3c;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

/* Task Details Styles */
.task-details {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fffe 0%, #ffffff 100%);
  border-bottom: 1px solid rgba(67, 206, 162, 0.15);
  max-height: 30vh;
  overflow-y: auto;
  flex-shrink: 0;
}

.task-id-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.task-field {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  font-weight: 600;
  color: #185a9d;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.field-value {
  background: rgba(245, 247, 250, 0.8);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border-left: 3px solid rgba(67, 206, 162, 0.3);
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.task-title {
  font-weight: 600;
  color: #185a9d;
  font-size: 1rem;
}

.task-description {
  min-height: 2.5rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.task-fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Status and Priority Colors */
.status-pending {
  color: #f9a825 !important;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.1) 0%, rgba(249, 168, 37, 0.05) 100%) !important;
  border-left-color: #f9a825 !important;
}

.status-in_progress,
.status-in-progress {
  color: #185a9d !important;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(24, 90, 157, 0.1) 0%, rgba(24, 90, 157, 0.05) 100%) !important;
  border-left-color: #185a9d !important;
}

.status-completed {
  color: #43cea2 !important;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, rgba(67, 206, 162, 0.05) 100%) !important;
  border-left-color: #43cea2 !important;
}

.priority-high {
  color: #e74c3c !important;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%) !important;
  border-left-color: #e74c3c !important;
}

.priority-medium {
  color: #f9a825 !important;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.1) 0%, rgba(249, 168, 37, 0.05) 100%) !important;
  border-left-color: #f9a825 !important;
}

.priority-low {
  color: #43cea2 !important;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, rgba(67, 206, 162, 0.05) 100%) !important;
  border-left-color: #43cea2 !important;
}

.comments-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: 50vh;
}

.loading,
.no-comments {
  text-align: center;
  color: #666;
  padding: 2rem;
  font-style: italic;
}

.comments-list {
  margin-bottom: 1.5rem;
}

.comment-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fafafa;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: bold;
  color: #185a9d;
}

.comment-date {
  font-size: 0.85rem;
  color: #666;
}

.comment-content p {
  margin: 0;
  line-height: 1.5;
  color: #333;
}

.comment-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.edit-btn {
  color: #185a9d;
  border-color: rgba(24, 90, 157, 0.2);
}

.edit-btn:hover {
  background: linear-gradient(135deg, rgba(24, 90, 157, 0.1) 0%, rgba(24, 90, 157, 0.05) 100%);
  border-color: #185a9d;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.15);
}

.delete-btn {
  color: #d32f2f;
  border-color: rgba(211, 47, 47, 0.2);
}

.delete-btn:hover {
  background: linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%);
  border-color: #d32f2f;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.15);
}

.comment-edit {
  margin-top: 0.5rem;
}

.edit-textarea {
  width: 100%;
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.edit-textarea:focus {
  outline: none;
  border-color: #43cea2;
  box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.1);
  transform: translateY(-1px);
}

.edit-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
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
  justify-content: center;
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.2);
}

.save-btn:hover {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.3);
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
  justify-content: center;
  box-shadow: 0 2px 8px rgba(102, 102, 102, 0.2);
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 102, 102, 0.3);
}

.add-comment {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.comment-input {
  width: 100%;
  border: 2px solid rgba(67, 206, 162, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.comment-input:focus {
  outline: none;
  border-color: #43cea2;
  box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.1);
  transform: translateY(-1px);
}

.add-comment-btn {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.2);
}

.add-comment-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 90, 157, 0.3);
}

.add-comment-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive design */
@media (max-width: 768px) {
  .comments-panel {
    max-width: 95vw;
    margin: 0.5rem;
  }

  .task-fields-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .comments-content {
    max-height: 35vh;
  }

  .task-details,
  .comments-content {
    padding: 1rem;
  }
}
</style>
