document.addEventListener("DOMContentLoaded", () => {
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');

    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => menuLateral.classList.toggle('aberto'));
    }

    const gradeAlbuns = document.querySelector('.grade-albuns');
    const filtroNome = document.getElementById('filtro-nome');
    const filtroGenero = document.getElementById('filtro-genero');
    
    let todosAlbunsComNota = [];

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

            // Busca as notas médias para organização antecipada
            todosAlbunsComNota = await Promise.all(albunsDoBanco.map(async (album) => {
                let mediaExibicao = 0.0;
                try {
                    const res = await fetch(`http://localhost:3000/api/albuns/${album.id}/resenhas`);
                    if (res.ok) {
                        const resenhas = await res.json();
                        if (resenhas.length > 0) {
                            const soma = resenhas.reduce((acc, r) => acc + parseFloat(r.nota), 0);
                            mediaExibicao = soma / resenhas.length;
                        }
                    }
                } catch (err) {}
                return { ...album, mediaExibicao };
            }));

            // REORGANIZAÇÃO: primeiro os gêneros do perfil, ordenados por MAIOR nota
            let albunsPreferidos = todosAlbunsComNota.filter(a => generosPreferidos.includes(a.genero));
            let outrosAlbuns = todosAlbunsComNota.filter(a => !generosPreferidos.includes(a.genero));

            albunsPreferidos.sort((a, b) => b.mediaExibicao - a.mediaExibicao);
            todosAlbunsComNota = [...albunsPreferidos, ...outrosAlbuns];

            popularFiltros(todosAlbunsComNota);
            renderizarCatalogo(todosAlbunsComNota);
            
        } catch (erro) {
            gradeAlbuns.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar o catálogo. Verifique o servidor.</p>`;
        }
    }

    function popularFiltros(albuns) {
        if (!filtroNome || !filtroGenero) return;
        
        const nomesUnicos = [...new Set(albuns.map(a => a.titulo))].sort();
        filtroNome.innerHTML = '<option value="">Todos os Álbuns</option>';
        nomesUnicos.forEach(nome => { filtroNome.innerHTML += `<option value="${nome}">${nome}</option>`; });

        const generosUnicos = [...new Set(albuns.map(a => a.genero))].sort();
        filtroGenero.innerHTML = '<option value="">Todos os Gêneros</option>';
        generosUnicos.forEach(genero => { filtroGenero.innerHTML += `<option value="${genero}">${genero}</option>`; });
    }

    function aplicarFiltros() {
        if (!filtroNome || !filtroGenero) return;
        const n = filtroNome.value;
        const g = filtroGenero.value;

        let filtrados = todosAlbunsComNota.filter(album => {
            return (n === "" || album.titulo === n) && (g === "" || album.genero === g);
        });
        renderizarCatalogo(filtrados);
    }

    if (filtroNome && filtroGenero) {
        filtroNome.addEventListener('change', aplicarFiltros);
        filtroGenero.addEventListener('change', aplicarFiltros);
    }

    function renderizarCatalogo(listaDeAlbuns) {
        gradeAlbuns.innerHTML = ''; 
        if(listaDeAlbuns.length === 0) {
            gradeAlbuns.innerHTML = '<p style="color:#fff;">Nenhum álbum encontrado.</p>';
            return;
        }

        for (const album of listaDeAlbuns) {
            const mediaStr = album.mediaExibicao.toFixed(1);
            const imagemCapa = album.capa ? album.capa : 'img/placeholder.jpg';

            const cartaoHTML = `
                <article class="cartao-album" data-genero="${album.genero}">
                    <a href="album.html?id=${album.id}" class="link-capa" aria-label="Ver detalhes">
                        <img src="${imagemCapa}" alt="Capa" class="imagem-capa">
                    </a>
                    <h3>${album.titulo}</h3>
                    <p class="ano-genero">${album.ano} • ${album.genero}</p>
                    <div class="estrelas">★ ${mediaStr}</div>
                </article>
            `;
            gradeAlbuns.innerHTML += cartaoHTML;
        }
    }

    buscarAlbunsDaAPI();
});