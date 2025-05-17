<script>
export default {
  name: 'AddCardForm',
  props: {
    isAdding: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      cardName: "",
      cardDescription: ""
    };
  },
  emits: ['add-card', 'show-form', 'cancel'],
  methods: {
    showAddCardForm() {
      this.$emit('show-form');
    },
    cancelAddCard() {
      this.cardName = "";
      this.cardDescription = "";
      this.$emit('cancel');
    },
    addCard() {
      if (!this.cardName.trim()) return;
      
      this.$emit('add-card', {
        name: this.cardName,
        description: this.cardDescription || ""
      });
      
      this.cardName = "";
      this.cardDescription = "";
    }
  }
};
</script>

<template>
  <div class="add-card-container" :class="{ 'is-adding': isAdding }">
    <!-- Button to add a new card -->
    <div v-if="!isAdding" class="add-card-button" @click="showAddCardForm">
      <span class="plus-icon">+</span>
      <span>Add card</span>
    </div>

    <!-- Form to add a new card -->
    <div v-else class="add-card-form-container">
      <form @submit.prevent="addCard" class="add-card-inline-form" @keydown.esc="cancelAddCard">
        <input 
          ref="cardNameInput" 
          v-model="cardName" 
          type="text" 
          placeholder="Enter card title..." 
          required 
          autocomplete="off" 
        />
        <textarea 
          v-model="cardDescription" 
          placeholder="Description (optional)" 
          rows="2"
        ></textarea>
        <div class="add-card-actions">
          <button type="submit" class="add-btn">Add Card</button>
          <button type="button" class="cancel-btn" @click="cancelAddCard">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Trello-style add card button and form */
.add-card-container {
  min-width: 280px;
  max-width: 280px;
  margin-bottom: 1rem;
  background: #43cea2;
  border-radius: 8px;
  height: fit-content;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.add-card-container.is-adding {
  background: #f0f4f8;
  border: 1px solid #e0e0e0;
}

.add-card-button {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

.add-card-button:hover {
  background-color: rgba(67, 206, 162, 0.1);
  background: #185a9d;
}

.plus-icon {
  font-size: 1.3rem;
  margin-right: 0.5rem;
  font-weight: bold;
}

.add-card-form-container {
  padding: 0.5rem;
}

.add-card-inline-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-card-inline-form input,
.add-card-inline-form textarea {
  padding: 0.6rem;
  border-radius: 3px;
  border: 1px solid #b2f7ef;
  font-size: 0.9rem;
  background: #fff;
  resize: none;
}

.add-card-inline-form input:focus,
.add-card-inline-form textarea:focus {
  border-color: #43cea2;
  outline: none;
  box-shadow: 0 0 0 2px rgba(67, 206, 162, 0.2);
}

.add-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.3rem;
}

.add-btn {
  padding: 0.5rem 1rem;
  background: #43cea2;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 600;
}

.add-btn:hover {
  background: #3bb292;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #5e6c84;
  border: none;
  cursor: pointer;
}

.cancel-btn:hover {
  color: #172b4d;
  background: rgba(9, 30, 66, 0.08);
  border-radius: 3px;
}
</style>
