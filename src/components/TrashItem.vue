<script>
export default {
  name: 'TrashItem',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['drag-enter', 'drag-leave', 'drop'],
  methods: {
    onDragEnter(event) {
      event.preventDefault();
      this.$emit('drag-enter', event);
    },
    onDragLeave(event) {
      event.preventDefault();
      this.$emit('drag-leave', event);
    },
    onDrop(event) {
      event.preventDefault();
      this.$emit('drop', event);
    }
  }
};
</script>

<template>
  <div 
    v-if="visible" 
    class="trash-item"
    :class="{ active }"
    @dragover.prevent
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <i class="material-icons trash-icon">delete</i>
    <span>Delete</span>
  </div>
</template>

<style scoped>
.trash-item {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(220, 53, 69, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: default;
}

.trash-item.active {
  transform: scale(1.2);
  background-color: rgba(220, 53, 69, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.trash-icon {
  font-size: 48px;
  margin-bottom: 8px;
  display: block;
}
</style>
