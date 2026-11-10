document.addEventListener("DOMContentLoaded", async () => {
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');
    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => menuLateral.classList.toggle('aberto'));
    }

    document.title = "Meu Perfil - Ressonance";

    const inputNome = document.getElementById('nome-usuario');
    const gridGeneros = document.getElementById('lista-generos');
    const btnSalvar = document.getElementById('btn-salvar');

    // Validação de token no perfil
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Faça login para acessar o perfil.");
        return;
    }

    let generosSelecionados = [];

    // 1. CARREGAR OS DADOS REAIS DO BANCO DE DADOS
    try {
        const res = await fetch('http://localhost:3000/api/usuarios/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const perfilSalvo = await res.json();
            inputNome.value = perfilSalvo.nome || '';
            generosSelecionados = perfilSalvo.generos || [];
            
            const nomeSidebar = document.getElementById('nome-perfil-sidebar');
            if (nomeSidebar) nomeSidebar.textContent = perfilSalvo.nome;
        }
    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
    }

    // Usando a base de dados em memória para gerar os botões disponíveis
    const generosUnicos = [...new Set(albuns.map(album => album.genero))].sort();

    // 2. RENDERIZAR OS BOTÕES NA TELA
    function renderizarGrid() {
        gridGeneros.innerHTML = '';
        generosUnicos.forEach(genero => {
            const btn = document.createElement('button');
            btn.classList.add('btn-genero');
            btn.textContent = genero;
            
            if (generosSelecionados.includes(genero)) {
                btn.classList.add('selecionado');
            }

            btn.addEventListener('click', () => {
                if (generosSelecionados.includes(genero)) {
                    generosSelecionados = generosSelecionados.filter(g => g !== genero);
                    btn.classList.remove('selecionado');
                } else {
                    if (generosSelecionados.length >= 3) {
                        alert("Você só pode escolher no máximo 3 gêneros.");
                        return;
                    }
                    generosSelecionados.push(genero);
                    btn.classList.add('selecionado');
                }
            });
            
            gridGeneros.appendChild(btn);
        });
    }

    renderizarGrid();

    // 3. SALVAR O PERFIL NO BACKEND
    btnSalvar.addEventListener('click', async () => {
        const nomeDigitado = inputNome.value.trim();
        
        if (!nomeDigitado) {
            alert("Por favor, digite o nome do usuário antes de salvar.");
            return;
        }

        try {
            // Requisição PUT atualizando no Banco (server.js)
            const res = await fetch('http://localhost:3000/api/usuarios/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: nomeDigitado,
                    generos: generosSelecionados
                })
            });

            if (res.ok) {
                const nomeSidebar = document.getElementById('nome-perfil-sidebar');
                if (nomeSidebar) nomeSidebar.textContent = nomeDigitado;
                alert("Perfil salvo com sucesso no banco de dados!");
            } else {
                alert("Falha ao salvar no banco de dados.");
            }
        } catch (erro) {
            alert("Erro de comunicação com o servidor.");
        }
    });
});