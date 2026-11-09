document.addEventListener("DOMContentLoaded", () => {
    // 1. Encontra o link/botão "Meu Perfil" na barra lateral
    const linkMeuPerfil = document.querySelector('a[href="meu-perfil.html"]');

    if (linkMeuPerfil) {
        linkMeuPerfil.addEventListener('click', (evento) => {
            evento.preventDefault(); // Impede o redirecionamento imediato

            // 2. Verifica se existe um token de login salvo
            const token = localStorage.getItem('token');

            if (token) {
                window.location.href = 'meu-perfil.html';
            } else {
                window.location.href = 'login.html'; 
            }
        });
    }


    // 3. Botão "Sair"
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('usuarioPerfil');
            
            if (nomeSidebar) nomeSidebar.textContent = "Nome do Perfil";
            
            alert("Sessão encerrada com sucesso.");
            window.location.href = 'index.html';
        });
    }
});