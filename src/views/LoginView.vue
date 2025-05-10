<script>
import { useDataStore } from '../stores/index';
import { mapActions } from 'pinia';

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      auth: useDataStore(),
    };
  },
  created() {
    if (this.$route.query.email) {
      this.email = this.$route.query.email;
    }
    if (this.$route.query.password) {
      this.password = this.$route.query.password;
    }
  },
  methods: {
    ...mapActions(useDataStore, ['loginUser']),
    async handleLogin(email, password) {
      if (await this.loginUser({ email, password })) {
        const redirect = '/projects';
        this.$router.push(redirect);
      }
    },
    goToRegister() {
      this.$router.push('/register');
    }
  },
};
</script>

<template>
  <div class="login-bg">
    <div class="login-card" v-if="!auth.loggedIn">
      <h2 class="login-title">Log in to Tareus</h2>
      <form @submit.prevent="handleLogin(email, password)">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <button type="submit" class="login-btn">Login</button>
      </form>
      <div class="register-link">
        <span>Don't have an account?</span>
        <button type="button" class="register-btn" @click="goToRegister">Register</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-bg {
  min-height: 100vh;
  background: linear-gradient(120deg, #e0f7fa 0%, #f5f7fa 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(24, 90, 157, 0.10);
  padding: 2.5rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 3.5rem;
}

.login-title {
  color: #185a9d;
  font-size: 1.7rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  letter-spacing: 1px;
}

.form-group {
  width: 100%;
  margin-bottom: 1.2rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #185a9d;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #b2f7ef;
  border-radius: 8px;
  font-size: 1rem;
  background: #f5f7fa;
  transition: border 0.2s;
}

input:focus {
  outline: none;
  border: 1.5px solid #43cea2;
  background: #fff;
}

.login-btn {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}

.login-btn:hover {
  background: linear-gradient(90deg, #185a9d 0%, #43cea2 100%);
}

.register-link {
  margin-top: 1.2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #185a9d;
}

.register-btn {
  background: none;
  border: none;
  color: #43cea2;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s;
}

.register-btn:hover {
  color: #185a9d;
}

@media (max-width: 767.98px) {
  .login-card {
    margin-right: 150px;
  }
}
</style>