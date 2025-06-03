<script>
import { Field, Form, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import { useDataStore } from '../stores/index.js';
import { mapActions } from 'pinia';
import ConfirmModal from './ConfirmModal.vue';

export default {
    name: 'EditProjectModal',
    components: {
        Field,
        Form,
        ErrorMessage,
        ConfirmModal,
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        project: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            formData: {
                name: "",
                description: "",
            },
            selectedUsers: [],
            existingUsers: [],
            availableUsers: [],
            filteredUsers: [],
            userSearch: "",
            loading: false,
            validationSchema: yup.object({
                name: yup.string().required('Project name is required'),
                description: yup.string().required('Project description is required'),
            }),
            // Confirm Modal
            showConfirmModal: false,
            confirmModal: {
                title: '',
                message: '',
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                dangerMode: true
            },
            confirmCallback: null,
            // Alert Modal
            showAlertModal: false,
            alertModal: {
                title: 'Error',
                message: '',
                dangerMode: true
            }
        };
    },
    methods: {
        ...mapActions(useDataStore, [
            'fetchUsers',
            'fetchProjectUsers',
            'updateProject',
            'assignUserToProject',
            'updateUserPermissions',
            'removeUserFromProject'
        ]),

        async loadUsers() {
            try {
                const allUsers = await this.fetchUsers();
                this.availableUsers = allUsers || [];
                this.filteredUsers = this.availableUsers.filter(user =>
                    !this.existingUsers.some(existingUser => existingUser.id === user.id)
                );
            } catch (error) {
                console.error('Error loading users:', error);
            }
        },

        async loadProjectUsers() {
            if (!this.project) return;

            try {
                const projectUsers = await this.fetchProjectUsers(this.project.id);
                this.existingUsers = (projectUsers || []).map(user => {
                    // Get permissions from the association table
                    const projectUser = user.Projects?.[0]?.ProjectUser;
                    const isOwner = this.project.owner_id === user.id;

                    return {
                        ...user,
                        isOwner: isOwner,
                        permissions: {
                            can_view: projectUser?.can_view || false,
                            can_edit: projectUser?.can_edit || false,
                            can_create: projectUser?.can_create || false,
                        }
                    };
                });
            } catch (error) {
                console.error('Error loading project users:', error);
            }
        },

        filterUsers() {
            if (!this.userSearch.trim()) {
                this.filteredUsers = this.availableUsers.filter(user =>
                    !this.existingUsers.some(existingUser => existingUser.id === user.id)
                );
                return;
            } const searchTerm = this.userSearch.toLowerCase();
            this.filteredUsers = this.availableUsers.filter(user => {
                const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm));
                const notInProject = !this.existingUsers.some(existingUser => existingUser.id === user.id);
                return matchesSearch && notInProject;
            });
        },

        isUserSelected(userId) {
            return this.selectedUsers.some(user => user.id === userId);
        },

        toggleUserSelection(user) {
            const existingIndex = this.selectedUsers.findIndex(u => u.id === user.id);

            if (existingIndex > -1) {
                this.selectedUsers.splice(existingIndex, 1);
            } else {
                this.selectedUsers.push({
                    ...user,
                    permissions: {
                        can_view: true,
                        can_edit: false,
                        can_create: false
                    }
                });
            }
        },

        async handlePermissionChange(user, permission) {
            // Prevent changing permissions for project owner
            if (user.isOwner) {
                return;
            }

            // Handle permission hierarchy for existing users
            if (permission === 'can_view') {
                if (!user.permissions.can_view) {
                    // If disabling view, disable edit and create
                    user.permissions.can_edit = false;
                    user.permissions.can_create = false;
                }
            } else if (permission === 'can_edit') {
                if (user.permissions.can_edit) {
                    // If enabling edit, auto-enable read
                    user.permissions.can_view = true;
                } else {
                    // If disabling edit, disable create
                    user.permissions.can_create = false;
                }
            } else if (permission === 'can_create') {
                if (user.permissions.can_create) {
                    // If enabling create, auto-enable read and edit
                    user.permissions.can_view = true;
                    user.permissions.can_edit = true;
                }
            }

            // Update permissions in database
            try {
                await this.updateUserPermissions(this.project.id, user.id, user.permissions);
            } catch (error) {
                console.error('Error updating user permissions:', error);
                this.showAlert('Error', 'Failed to update user permissions');
            }
        },

        handleNewUserPermissionChange(user, permission) {
            // Handle permission hierarchy for new users to be added
            if (permission === 'can_view') {
                if (!user.permissions.can_view) {
                    // If disabling view, disable edit and create
                    user.permissions.can_edit = false;
                    user.permissions.can_create = false;
                }
            } else if (permission === 'can_edit') {
                if (user.permissions.can_edit) {
                    // If enabling edit, auto-enable read
                    user.permissions.can_view = true;
                } else {
                    // If disabling edit, disable create
                    user.permissions.can_create = false;
                }
            } else if (permission === 'can_create') {
                if (user.permissions.can_create) {
                    // If enabling create, auto-enable read and edit
                    user.permissions.can_view = true;
                    user.permissions.can_edit = true;
                }
            }
        },

        removeUser(userId) {
            const index = this.selectedUsers.findIndex(user => user.id === userId);
            if (index > -1) {
                this.selectedUsers.splice(index, 1);
            }
        },

        async removeExistingUser(userId) {
            // Prevent removing the project owner
            const userToRemove = this.existingUsers.find(user => user.id === userId);
            if (userToRemove?.isOwner) {
                this.showAlert('Error', 'Cannot remove the project owner');
                return;
            }

            this.showConfirm(
                'Remove User',
                'Are you sure you want to remove this user from the project?',
                async () => {
                    try {
                        // Call store method to remove user from project
                        await this.removeUserFromProject(this.project.id, userId);

                        // Remove from local list
                        this.existingUsers = this.existingUsers.filter(user => user.id !== userId);

                        // Update filtered users to include this user again
                        this.filterUsers();
                    } catch (error) {
                        console.error('Error removing user from project:', error);
                        this.showAlert('Error', 'Failed to remove user from project');
                    }
                }
            );
        },

        applyPreset(presetType) {
            const presets = {
                viewer: { can_view: true, can_edit: false, can_create: false },
                editor: { can_view: true, can_edit: true, can_create: false },
                admin: { can_view: true, can_edit: true, can_create: true }
            };

            const preset = presets[presetType];
            this.selectedUsers.forEach(user => {
                user.permissions = { ...preset };
            });
        },

        closeModal() {
            this.resetForm();
            this.$emit('close');
        },

        resetForm() {
            this.formData = {
                name: "",
                description: "",
            };
            this.selectedUsers = [];
            this.existingUsers = [];
            this.userSearch = "";
            this.filteredUsers = this.availableUsers;
            this.loading = false;
        },

        // Helper methods for modals
        showAlert(title, message, dangerMode = true) {
            this.alertModal = { title, message, dangerMode };
            this.showAlertModal = true;
        },

        showConfirm(title, message, callback, confirmText = 'Confirm', cancelText = 'Cancel', dangerMode = true) {
            this.confirmModal = { title, message, confirmText, cancelText, dangerMode };
            this.confirmCallback = callback;
            this.showConfirmModal = true;
        },

        handleConfirm() {
            this.showConfirmModal = false;
            if (this.confirmCallback) {
                this.confirmCallback();
                this.confirmCallback = null;
            }
        },

        handleCancel() {
            this.showConfirmModal = false;
            this.confirmCallback = null;
        },

        handleAlertClose() {
            this.showAlertModal = false;
        },

        async handleUpdateProject(values) {
            this.loading = true;

            try {
                // Update project basic information
                const updatedProject = await this.updateProject({
                    id: this.project.id,
                    name: values.name,
                    description: values.description
                });                // Update existing users' permissions (exclude owner)
                for (const user of this.existingUsers) {
                    // Skip owner - owner permissions cannot be changed
                    if (user.isOwner) {
                        continue;
                    }

                    try {
                        await this.updateUserPermissions(
                            this.project.id,
                            user.id,
                            user.permissions
                        );
                    } catch (error) {
                        console.error(`Error updating permissions for user ${user.id}:`, error);
                    }
                }

                // Add new users to project
                for (const user of this.selectedUsers) {
                    try {
                        await this.assignUserToProject(
                            this.project.id,
                            user.id,
                            user.permissions
                        );
                    } catch (error) {
                        console.error(`Error adding user ${user.id} to project:`, error);
                    }
                }

                this.$emit('updated', updatedProject); this.resetForm();
            } catch (error) {
                console.error("Error updating project:", error);
                this.showAlert('Error', 'Failed to update project. Please try again.');
            } finally {
                this.loading = false;
            }
        },

        async initializeModal() {
            if (!this.project) return;

            // Initialize form data
            this.formData = {
                name: this.project.name || "",
                description: this.project.description || "",
            };

            // Load users and project users
            await Promise.all([
                this.loadUsers(),
                this.loadProjectUsers()
            ]);

            // Filter available users (exclude existing ones)
            this.filterUsers();
        },
    },
    watch: {
        show(newValue) {
            if (newValue && this.project) {
                this.initializeModal();
            }
        },
        project(newValue) {
            if (newValue && this.show) {
                this.initializeModal();
            }
        }
    }
};
</script>

<template>
    <div class="modal-overlay" v-if="show" @click="closeModal">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>Edit Project</h3>
                <button class="close-btn" @click="closeModal">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <Form :validation-schema="validationSchema" @submit="handleUpdateProject" :initial-values="formData">
                <div class="modal-body">
                    <!-- Project Information -->
                    <div class="form-section">
                        <h4 class="section-title">Project Information</h4>
                        <div class="form-group">
                            <label for="name">Project Name:</label>
                            <Field id="name" name="name" type="text" v-model="formData.name" class="form-input" />
                            <ErrorMessage name="name" class="error-message" />
                        </div>

                        <div class="form-group">
                            <label for="description">Description:</label>
                            <Field as="textarea" id="description" name="description" v-model="formData.description"
                                class="form-textarea" />
                            <ErrorMessage name="description" class="error-message" />
                        </div>
                    </div>

                    <!-- User Management Section -->
                    <div class="form-section">
                        <h4 class="section-title">Manage Users & Permissions</h4>

                        <!-- Existing Users -->
                        <div class="existing-users-section" v-if="existingUsers.length > 0">
                            <h5 class="subsection-title">Current Project Members</h5>
                            <div class="existing-users-list">
                                <div v-for="user in existingUsers" :key="user.id" class="existing-user-item">
                                    <div class="user-info">
                                        <div class="user-avatar">
                                            {{ (user.name || user.username || 'U').charAt(0).toUpperCase() }}
                                        </div>
                                        <div class="user-details">
                                            <span class="user-name">
                                                {{ user.name }}
                                                <span v-if="user.isOwner" class="owner-badge">Owner</span>
                                            </span>
                                            <span class="user-email">{{ user.email }}</span>
                                        </div>
                                    </div>
                                    <div class="user-permissions">
                                        <div class="permission-checkboxes">
                                            <label class="permission-checkbox">
                                                <input type="checkbox" v-model="user.permissions.can_view"
                                                    :disabled="user.isOwner"
                                                    @change="handlePermissionChange(user, 'can_view')" />
                                                <span class="checkmark" :class="{ disabled: user.isOwner }"></span>
                                                Read
                                            </label>
                                            <label class="permission-checkbox">
                                                <input type="checkbox" v-model="user.permissions.can_edit"
                                                    :disabled="user.isOwner"
                                                    @change="handlePermissionChange(user, 'can_edit')" />
                                                <span class="checkmark" :class="{ disabled: user.isOwner }"></span>
                                                Edit
                                            </label>
                                            <label class="permission-checkbox">
                                                <input type="checkbox" v-model="user.permissions.can_create"
                                                    :disabled="user.isOwner"
                                                    @change="handlePermissionChange(user, 'can_create')" />
                                                <span class="checkmark" :class="{ disabled: user.isOwner }"></span>
                                                Create
                                            </label>
                                        </div>
                                        <button type="button" class="remove-user-btn" v-if="!user.isOwner"
                                            @click="removeExistingUser(user.id)" title="Remove user from project">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                        <div v-else class="owner-indicator" title="Project owner cannot be removed">
                                            <i class="bi bi-crown-fill"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Add New Users -->
                        <div class="add-users-section">
                            <h5 class="subsection-title">Add New Users</h5>

                            <!-- User Search -->
                            <div class="form-group">
                                <label for="userSearch">Search Users:</label>
                                <div class="search-container">
                                    <input id="userSearch" type="text" v-model="userSearch"
                                        placeholder="Search by name or email..." class="form-input search-input"
                                        @input="filterUsers" />
                                    <i class="bi bi-search search-icon"></i>
                                </div>
                            </div>

                            <!-- Available Users List -->
                            <div class="users-container" v-if="filteredUsers.length > 0">
                                <div class="users-list">
                                    <div v-for="user in filteredUsers" :key="user.id" class="user-item"
                                        :class="{ 'selected': isUserSelected(user.id) }"
                                        @click="toggleUserSelection(user)">
                                        <div class="user-info">
                                            <div class="user-avatar">
                                                {{ (user.name || user.username || 'U').charAt(0).toUpperCase() }}
                                            </div>
                                            <div class="user-details">
                                                <span class="user-name">{{ user.name }}</span>
                                                <span class="user-email">{{ user.email || 'No email' }}</span>
                                            </div>
                                        </div>
                                        <div class="user-selection">
                                            <input type="checkbox" :checked="isUserSelected(user.id)" @click.stop
                                                @change="toggleUserSelection(user)" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Selected Users Management -->
                            <div class="selected-users-section" v-if="selectedUsers.length > 0">
                                <h5 class="subsection-title">New Users to Add</h5>

                                <!-- Permission Presets -->
                                <div class="preset-buttons">
                                    <button type="button" class="preset-btn" @click="applyPreset('viewer')">
                                        Set All as Viewers
                                    </button>
                                    <button type="button" class="preset-btn" @click="applyPreset('editor')">
                                        Set All as Editors
                                    </button>
                                    <button type="button" class="preset-btn" @click="applyPreset('admin')">
                                        Set All as Admins
                                    </button>
                                </div>

                                <div class="selected-users-list">
                                    <div v-for="user in selectedUsers" :key="user.id" class="selected-user-item">
                                        <div class="user-info">
                                            <div class="user-avatar">
                                                {{ (user.name || user.username || 'U').charAt(0).toUpperCase() }}
                                            </div>
                                            <div class="user-details">
                                                <span class="user-name">{{ user.name }}</span>
                                                <span class="user-email">{{ user.email || 'No email' }}</span>
                                            </div>
                                        </div>
                                        <div class="user-permissions">
                                            <div class="permission-checkboxes">
                                                <label class="permission-checkbox">
                                                    <input type="checkbox" v-model="user.permissions.can_view"
                                                        @change="handleNewUserPermissionChange(user, 'can_view')" />
                                                    <span class="checkmark"></span>
                                                    Read
                                                </label>
                                                <label class="permission-checkbox">
                                                    <input type="checkbox" v-model="user.permissions.can_edit"
                                                        @change="handleNewUserPermissionChange(user, 'can_edit')" />
                                                    <span class="checkmark"></span>
                                                    Edit
                                                </label>
                                                <label class="permission-checkbox">
                                                    <input type="checkbox" v-model="user.permissions.can_create"
                                                        @change="handleNewUserPermissionChange(user, 'can_create')" />
                                                    <span class="checkmark"></span>
                                                    Create
                                                </label>
                                            </div>
                                            <button type="button" class="remove-user-btn" @click="removeUser(user.id)"
                                                title="Remove from selection">
                                                <i class="bi bi-x-lg"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="cancel-btn" @click="closeModal" :disabled="loading">
                        Cancel
                    </button>
                    <button type="submit" class="submit-btn" :disabled="loading">
                        <span v-if="loading" class="loading-spinner"></span>
                        <span v-if="loading">Updating...</span>
                        <span v-else>Update Project</span>
                    </button>
                </div>
            </Form>
        </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal :visible="showConfirmModal" :title="confirmModal.title" :message="confirmModal.message"
        :confirmText="confirmModal.confirmText" :cancelText="confirmModal.cancelText"
        :dangerMode="confirmModal.dangerMode" @confirm="handleConfirm" @cancel="handleCancel" />

    <!-- Alert Modal -->
    <ConfirmModal :visible="showAlertModal" :title="alertModal.title" :message="alertModal.message" :confirmText="'OK'"
        :cancelText="''" :dangerMode="alertModal.dangerMode" @confirm="handleAlertClose" @cancel="handleAlertClose" />
</template>


<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css");

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 95%;
    max-width: 800px;
    max-height: 95vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-30px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 16px 16px 0 0;
}

.modal-header h3 {
    margin: 0;
    color: #185a9d;
    font-size: 1.5rem;
    font-weight: 700;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background-color: #f3f4f6;
    color: #374151;
}

.modal-body {
    padding: 2rem;
    max-height: 60vh;
    overflow-y: auto;
}

.form-section {
    margin-bottom: 2rem;
}

.section-title {
    color: #185a9d;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(67, 206, 162, 0.2);
}

.subsection-title {
    color: #43cea2;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background-color: #ffffff;
    box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: #43cea2;
    box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.1);
}

.form-textarea {
    min-height: 100px;
    resize: vertical;
}

.search-container {
    position: relative;
    width: 100%;
}

.search-input {
    width: 100%;
    padding-right: 2.5rem;
    box-sizing: border-box;
}

.search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

/* Existing Users Styles */
.existing-users-section {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.existing-users-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.existing-user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.existing-user-item:hover {
    border-color: #43cea2;
    box-shadow: 0 2px 8px rgba(67, 206, 162, 0.1);
}

/* Add Users Section */
.add-users-section {
    padding: 1rem;
    background-color: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bae6fd;
}

.users-container {
    margin-bottom: 1.5rem;
}

.users-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f3f4f6;
}

.user-item:last-child {
    border-bottom: none;
}

.user-item:hover {
    background-color: #f8fafc;
}

.user-item.selected {
    background-color: #ecfdf5;
    border-left: 4px solid #43cea2;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(45deg, #43cea2, #185a9d);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1rem;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 500;
    color: #111827;
}

.user-email {
    font-size: 0.875rem;
    color: #6b7280;
}

.user-selection input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

/* Selected Users Styles */
.selected-users-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f0fdf4;
    border-radius: 8px;
    border: 1px solid #bbf7d0;
}

.preset-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.preset-btn {
    padding: 0.5rem 1rem;
    background: linear-gradient(90deg, #43cea2, #185a9d);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.preset-btn:hover {
    background: linear-gradient(90deg, #185a9d, #43cea2);
    transform: translateY(-1px);
}

.selected-users-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.selected-user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #d1fae5;
    transition: all 0.2s ease;
}

.selected-user-item:hover {
    border-color: #43cea2;
    box-shadow: 0 2px 8px rgba(67, 206, 162, 0.1);
}

/* User Permissions */
.user-permissions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.permission-checkboxes {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.permission-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    position: relative;
}

.permission-checkbox input[type="checkbox"] {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;
}

.permission-checkbox input[type="checkbox"]:checked {
    background-color: #43cea2;
    border-color: #43cea2;
}

.permission-checkbox input[type="checkbox"]:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
}

.checkmark {
    font-size: 0.875rem;
    font-weight: 500;
}

.remove-user-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
}

.remove-user-btn:hover {
    background: #dc2626;
    transform: translateY(-1px);
}

/* Owner Badge and Indicator */
.owner-badge {
    background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    margin-left: 0.5rem;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}

.owner-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: #fbbf24;
    font-size: 1.2rem;
}

/* Disabled States */
.permission-checkbox input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.permission-checkbox .checkmark.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.permission-checkbox:has(input[type="checkbox"]:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Modal Footer */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem 2rem;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
    border-radius: 0 0 16px 16px;
}

.cancel-btn,
.submit-btn {
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.cancel-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
}

.cancel-btn:hover:not(:disabled) {
    background: #e5e7eb;
}

.submit-btn {
    background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 16px rgba(24, 90, 157, 0.15);
}

.submit-btn:hover:not(:disabled) {
    background: linear-gradient(90deg, #185a9d 0%, #43cea2 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(24, 90, 157, 0.25);
}

.submit-btn:disabled,
.cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .modal-content {
        width: 98%;
        max-height: 98vh;
        margin: 1vh;
    }

    .modal-header,
    .modal-footer {
        padding: 1rem;
    }

    .modal-body {
        padding: 1rem;
    }

    .permission-checkboxes {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .user-permissions {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .preset-buttons {
        flex-direction: column;
    }

    .existing-user-item,
    .selected-user-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}

/* Owner badge styles */
.owner-badge {
    background: linear-gradient(45deg, #f59e0b, #d97706);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
    margin-left: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

/* Owner indicator styles */
.owner-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    color: #f59e0b;
    font-size: 1.1rem;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.1);
    border: 2px solid rgba(245, 158, 11, 0.3);
}

/* Disabled permission styles */
.permission-checkbox input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.permission-checkbox .checkmark.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f3f4f6;
}

.permission-checkbox .checkmark.disabled::after {
    border-color: #9ca3af;
}

/* Enhanced user name styles for owner */
.user-name {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}
</style>
