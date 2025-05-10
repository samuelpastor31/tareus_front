<script>
import { useDataStore } from "../stores/index";
import { mapActions } from "pinia";

export default {
  name: "RegisterView",
  data() {
    return {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      auth: useDataStore(),
      error: "",
    };
  },
  methods: {
    ...mapActions(useDataStore, ["registerUser"]),
    async handleRegister() {
      this.error = "";
      if (this.password !== this.confirmPassword) {
        this.error = "Passwords do not match.";
        return;
      }

      const userData = {
        username: this.name,
        email: this.email,
        password: this.password,
      };

      try {
        const result = await this.registerUser(userData);

        if (result && result.message && result.user) {
          this.$router.push({
            path: "/",
            query: {
              email: this.email,
              password: this.password
            }
          });
          return;
        }
      } catch (e) {
        const errData = e?.response?.data;
        let messages = [];

        if (errData?.message) {
          messages.push(errData.message);
        }

        const detail = errData?.detail;

        if (typeof detail === "string") {
          messages.push(detail);
        } else if (Array.isArray(detail)) {
          messages.push(...detail.map((d) => d.message || d));
        }

        this.error = messages.length > 0 ? messages.join(" - ") : "Registration failed. Try again.";
      }
    },

    goToLogin() {
      this.$router.push("/");
    },
  },
};
</script>

<template>
  <div class="login-bg">
    <div class="login-card">
      <h2 class="login-title">Create your account</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" v-model="name" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required />
        </div>
        <div v-if="error" class="register-error">{{ error }}</div>
        <button type="submit" class="login-btn">Register</button>
      </form>
      <div class="register-link">
        <span>Already have an account?</span>
        <button type="button" class="register-btn" @click="goToLogin">Login</button>
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
  box-shadow: 0 4px 24px rgba(24, 90, 157, 0.1);
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

.register-error {
  color: #d32f2f;
  font-size: 0.98rem;
  margin-bottom: 0.7rem;
  text-align: center;
}

@media (max-width: 767.98px) {
  .login-card {
    margin-right: 150px;
  }
}
</style>
