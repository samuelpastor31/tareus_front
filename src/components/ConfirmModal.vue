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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
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
  background-color: #43cea2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.danger-btn {
  background-color: #dc3545;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:hover {
  background-color: #3bb292;
}

.danger-btn:hover {
  background-color: #c82333;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
</style>
