// frontend/script.js
document.addEventListener("DOMContentLoaded", () => {
    // 1. Lógica do Menu Lateral
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');

    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('aberto');
        });
    }

    const gradeAlbuns = document.querySelector('.grade-albuns');

    // 2. NOVA LÓGICA: Buscar Álbuns do Backend (API) via Fetch
    async function buscarAlbunsDaAPI() {
        try {
            // Faz a requisição HTTP GET para a sua API no Node.js
            const resposta = await fetch('http://localhost:3000/api/albuns');
            
            if (!resposta.ok) {
                throw new Error('Falha ao buscar os álbuns do servidor.');
            }

            const albunsDoBanco = await resposta.json();
            renderizarCatalogo(albunsDoBanco);
            
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            gradeAlbuns.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar o catálogo. Verifique se o servidor backend está rodando.</p>`;
        }
    }

    // 3. Renderizar o Catálogo na Tela
    function renderizarCatalogo(listaDeAlbuns) {
        gradeAlbuns.innerHTML = ''; 

        // Recupera os gêneros escolhidos pelo utilizador (por enquanto mantemos no localStorage o perfil, 
        // mas a nota máxima seria alcançada movendo isso para o banco de dados também no futuro)
        const perfilSalvo = JSON.parse(localStorage.getItem('usuarioPerfil'));
        const generosPreferidos = perfilSalvo && perfilSalvo.generos ? perfilSalvo.generos : [];

        // Separa os álbuns em dois grupos com base nas preferências
        const albunsPreferidos = listaDeAlbuns.filter(album => generosPreferidos.includes(album.genero));
        const outrosAlbuns = listaDeAlbuns.filter(album => !generosPreferidos.includes(album.genero));

        // Neste momento, estamos simulando a ordenação pois a média virá das resenhas (próximo passo da API)
        // Por hora, apenas junta os dois grupos: Preferidos primeiro, seguidos do resto
        const albunsOrdenados = [...albunsPreferidos, ...outrosAlbuns];

        // Desenha os cartões na tela
        albunsOrdenados.forEach(album => {
            // Média fictícia para visualização até conectarmos as resenhas no backend
            const mediaExibicao = "4.5"; 
            
            // Tratamento caso a capa seja null no banco de dados
            const imagemCapa = album.capa ? album.capa : 'img/placeholder.jpg';

            const cartaoHTML = `
                <article class="cartao-album" data-genero="${album.genero}">
                    <a href="album.html?id=${album.id}" class="link-capa" aria-label="Ver detalhes de ${album.titulo}">
                        <img src="${imagemCapa}" alt="Capa do álbum ${album.titulo}" class="imagem-capa">
                    </a>
                    <h3>${album.titulo}</h3>
                    <p class="ano-genero">${album.ano} • ${album.genero}</p>
                    
                    <div class="estrelas" aria-label="Avaliação média: ${mediaExibicao} de 5">
                        ★ ${mediaExibicao}
                    </div>
                </article>
            `;
            
            gradeAlbuns.innerHTML += cartaoHTML;
        });
    }

    // Inicia a busca assim que a página carrega
    buscarAlbunsDaAPI();
});