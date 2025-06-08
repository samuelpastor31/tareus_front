<script>
export default {
  name: 'ConfirmModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirm'
    },
    message: {
      type: String,
      default: 'Are you sure?'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    dangerMode: {
      type: Boolean,
      default: true
    }
  },
  emits: ['confirm', 'cancel'],
  methods: {
    onConfirm() {
      this.$emit('confirm');
    },
    onCancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <h3 :class="{ 'danger-title': dangerMode }">{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button @click="onConfirm" class="confirm-btn" :class="{ 'danger-btn': dangerMode }">{{ confirmText }}</button>
        <button @click="onCancel" class="cancel-btn">{{ cancelText }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 15000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transform: scale(1);
  transition: transform 0.2s ease-out;
  position: relative;
}

.modal-container h3 {
  margin-top: 0;
  color: #185a9d;
}

.danger-title {
  color: #dc3545;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.confirm-btn {
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(67, 206, 162, 0.2);
}

.danger-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
}

.cancel-btn {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.3);
}

.danger-btn:hover {
  background: linear-gradient(135deg, #a71e2a 0%, #922b38 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #495057 0%, #343a40 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}
</style>
