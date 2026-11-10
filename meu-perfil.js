document.addEventListener("DOMContentLoaded", () => {
    // Menu Lateral
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');
    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => menuLateral.classList.toggle('aberto'));
    }

    document.title = "Meu Perfil - Ressonance";


    const inputNome = document.getElementById('nome-usuario');
    const gridGeneros = document.getElementById('lista-generos');
    const btnSalvar = document.getElementById('btn-salvar');

    const generosUnicos = [...new Set(albuns.map(album => album.genero))].sort();
    let generosSelecionados = [];


    const perfilSalvo = JSON.parse(localStorage.getItem('usuarioPerfil'));
    if (perfilSalvo) {
        inputNome.value = perfilSalvo.nome || '';
        generosSelecionados = perfilSalvo.generos || [];
    }
  
    //LISTA DE GENEROS
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

    // SALVAR PERFIL
    btnSalvar.addEventListener('click', () => {
        const nomeDigitado = inputNome.value.trim();
        
        if (!nomeDigitado) {
            alert("Por favor, digite o nome do usuário antes de salvar.");
            return;
        }

        const dadosPerfil = {
            nome: nomeDigitado,
            generos: generosSelecionados
        };
        localStorage.setItem('usuarioPerfil', JSON.stringify(dadosPerfil));

        const nomeSidebar = document.getElementById('nome-perfil-sidebar');
        if (nomeSidebar) nomeSidebar.textContent = nomeDigitado;

        alert("Perfil salvo com sucesso!");
    });
});