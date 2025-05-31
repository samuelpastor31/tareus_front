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
    isVisible: {
      type: Boolean,
      default: false,
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
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    canEditComment(comment) {
      // User can edit if they are the author of the comment
      const currentUserId = localStorage.getItem('user_id');
      return currentUserId && comment.user_id && parseInt(currentUserId) === parseInt(comment.user_id);
    },

    closeComments() {
      this.$emit('close');
    }
  },
};
</script>

<template>
  <div v-if="isVisible" class="comments-overlay" @click="closeComments">
    <div class="comments-panel" @click.stop>
      <div class="comments-header">
        <h3>Task Comments</h3>
        <button @click="closeComments" class="close-btn">&times;</button>
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
                <button @click="saveEdit(comment.id)" class="save-btn">Save</button>
                <button @click="cancelEdit" class="cancel-btn">Cancel</button>
              </div>
            </div>

            <div v-else class="comment-content">
              <p>{{ comment.content }}</p>
              <div v-if="canEditComment(comment)" class="comment-actions">
                <button @click="startEdit(comment)" class="edit-btn">Edit</button>
                <button @click="deleteComment(comment.id)" class="delete-btn">Delete</button>
              </div>
            </div>
          </div>
        </div>
        <div class="add-comment">
          <textarea v-model="newComment" placeholder="Write a comment..." class="comment-input" rows="3"
            @keydown.ctrl.enter="addComment"></textarea>
          <button @click="addComment" :disabled="!newComment.trim()" class="add-comment-btn">
            Add Comment
          </button>

        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <confirm-modal :visible="showDeleteModal" title="Confirm Deletion"
      :message="`Are you sure you want to delete this comment?`" confirmText="Delete" cancelText="Cancel"
      :dangerMode="true" @confirm="confirmDeleteComment" @cancel="cancelDeleteComment" />
  </div>
</template>

<style scoped>
.comments-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.comments-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.comments-content {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
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
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.edit-btn {
  color: #185a9d;
}

.edit-btn:hover {
  background: rgba(24, 90, 157, 0.1);
}

.delete-btn {
  color: #d32f2f;
}

.delete-btn:hover {
  background: rgba(211, 47, 47, 0.1);
}

.comment-edit {
  margin-top: 0.5rem;
}

.edit-textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.edit-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.save-btn {
  background: #185a9d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background: #14486d;
}

.cancel-btn {
  background: #666;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #555;
}

.add-comment {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.comment-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 0.75rem;
}

.comment-input:focus {
  outline: none;
  border-color: #185a9d;
}

.add-comment-btn {
  background: #185a9d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.add-comment-btn:hover:not(:disabled) {
  background: #14486d;
}

.add-comment-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
