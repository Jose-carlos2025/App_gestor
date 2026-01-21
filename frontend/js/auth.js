// Sistema de autenticação

class AuthManager {
    constructor() {
        this.init();
    }
    
    async init() {
        // Verificar autenticação ao carregar a página
        await this.checkAuth();
    }
    
    async checkAuth() {
        try {
            const response = await fetch('/api/check-auth', {
                credentials: 'include' // Importante para sessões
            });
            
            const data = await response.json();
            
            const currentPath = window.location.pathname;
            
            if (data.authenticated) {
                // Usuário está logado
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Se estiver na página de login, redirecionar para dashboard
                if (currentPath === '/login' || currentPath === '/') {
                    window.location.href = '/dashboard';
                }
                
                // Atualizar saudação do usuário
                this.updateUserGreeting(data.user);
                
                return true;
            } else {
                // Usuário não está logado
                localStorage.removeItem('user');
                
                // Se não estiver na página de login, redirecionar
                if (currentPath !== '/login' && currentPath !== '/') {
                    window.location.href = '/login';
                }
                
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            
            // Em caso de erro, redirecionar para login se não estiver lá
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = '/login';
            }
            
            return false;
        }
    }
    
    updateUserGreeting(user) {
        const greetingElement = document.getElementById('userGreeting');
        const userNameElement = document.getElementById('userName');
        
        if (greetingElement && user) {
            greetingElement.textContent = `Olá, ${user.name}`;
        }
        
        if (userNameElement && user) {
            userNameElement.textContent = user.name;
        }
    }
    
    async logout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            localStorage.removeItem('user');
            window.location.href = '/login';
        } catch (error) {
            console.error('Erro no logout:', error);
            // Forçar logout mesmo com erro
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }
    
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }
    
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
}

// Criar instância global
const auth = new AuthManager();

// Função global para logout
window.logout = () => auth.logout();

// Verificar autenticação quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Atualizar saudação se estiver logado
    const user = auth.getCurrentUser();
    if (user) {
        auth.updateUserGreeting(user);
    }
});