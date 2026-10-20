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

    // 2. Buscar Álbuns do Backend (API) via Fetch
    async function buscarAlbunsDaAPI() {
        try {
   
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


    // 2. Buscar Álbuns do Backend
    async function buscarAlbunsDaAPI() {
        try {
   
            const respostaAlbuns = await fetch('http://localhost:3000/api/albuns');
            if (!respostaAlbuns.ok) throw new Error('Falha ao buscar os álbuns.');
            const albunsDoBanco = await respostaAlbuns.json();

            let generosPreferidos = [];
            const token = localStorage.getItem('token');
            if (token) {
                const respostaPerfil = await fetch('http://localhost:3000/api/usuarios/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (respostaPerfil.ok) {
                    const perfil = await respostaPerfil.json();
                    generosPreferidos = perfil.generos || [];
                }
            }

            renderizarCatalogo(albunsDoBanco, generosPreferidos);
            
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            gradeAlbuns.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar o catálogo. Verifique o servidor.</p>`;
        }
    }

    // 3. Renderizar o Catálogo na Tela
    async function renderizarCatalogo(listaDeAlbuns, generosPreferidos) {
        gradeAlbuns.innerHTML = ''; 
        const albunsPreferidos = listaDeAlbuns.filter(album => generosPreferidos.includes(album.genero));
        const outrosAlbuns = listaDeAlbuns.filter(album => !generosPreferidos.includes(album.genero));
        const albunsOrdenados = [...albunsPreferidos, ...outrosAlbuns];

        for (const album of albunsOrdenados) {
            let mediaExibicao = "0.0";
            try {
                const res = await fetch(`http://localhost:3000/api/albuns/${album.id}/resenhas`);
                if (res.ok) {
                    const resenhas = await res.json();
                    if (resenhas.length > 0) {
                        const soma = resenhas.reduce((acc, r) => acc + parseFloat(r.nota), 0);
                        mediaExibicao = (soma / resenhas.length).toFixed(1);
                    }
                }
            } catch (err) {
                console.error(`Erro ao buscar resenhas do álbum ${album.id}:`, err);
            }

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
        }
    }

    buscarAlbunsDaAPI();
})