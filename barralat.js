document.addEventListener("DOMContentLoaded", () => {
    // 1. Atualizar o nome do perfil na barra lateral
    const nomeSidebar = document.getElementById('nome-perfil-sidebar');
    const dadosPerfil = JSON.parse(localStorage.getItem('usuarioPerfil'));
    
    // Se o usuário estiver logado e tivermos os dados
    if (dadosPerfil && nomeSidebar) {
        if (dadosPerfil.perfil === 'admin') {
            nomeSidebar.textContent = "Painel Admin";
            nomeSidebar.href = "admin.html"; 
        } else if (dadosPerfil.nome) {
            nomeSidebar.textContent = dadosPerfil.nome;
        }
    }

    // 2. Encontra o link/botão "Meu Perfil" / "Painel Admin" na barra lateral
    // Pega todos os links que apontam para o perfil ou admin para interceptar o clique
    const linksPerfilAdmin = document.querySelectorAll('a[href="meu-perfil.html"], a[href="admin.html"]');

    linksPerfilAdmin.forEach(link => {
        link.addEventListener('click', (evento) => {
            evento.preventDefault(); 
            
            const token = localStorage.getItem('token');
            const perfilAtual = JSON.parse(localStorage.getItem('usuarioPerfil'));

            if (!token) {
                window.location.href = 'login.html'; 
                return;
            }
            
            // Garante que se o admin clicar na foto, vai para a página certa
            if (perfilAtual && perfilAtual.perfil === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'meu-perfil.html';
            }
        });
    });

    // 3. Botão "Sair" Corrigido (da mensagem anterior)
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            
            localStorage.removeItem('token');
            localStorage.removeItem('usuarioPerfil');
            
            if (nomeSidebar) nomeSidebar.textContent = "Fazer Login";
            
            alert("Sessão encerrada com sucesso.");
            window.location.href = 'login.html';
        });
    }
});