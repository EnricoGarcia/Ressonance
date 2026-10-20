document.addEventListener("DOMContentLoaded", async () => {
    function sanitizarHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    // 1. MENU LATERAL
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');
    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('aberto');
        });
    }

    // 2. BOTÃO AVALIAR
    const btnAvaliar = document.querySelector('.btn-avaliar');
    if (btnAvaliar) {
        btnAvaliar.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = `adicionar-resenha.html?id=${albumId}`;
            } else {
                alert("Você precisa estar logado para adicionar uma resenha!");
                // No futuro, redirecionaremos para a tela de login aqui.
                window.location.href = 'index.html'; 
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const albumId = parseInt(params.get('id'));

    if (!albumId) {
        window.location.href = 'index.html';
        return;
    }

    const detalhesTopo = document.getElementById('detalhes-topo');
    const listaResenhas = document.getElementById('lista-resenhas');

    try {
        // 3. BUSCA DOS DADOS DO BACKEND
        const [resAlbum, resFaixas, resResenhas] = await Promise.all([
            fetch('http://localhost:3000/api/albuns'),
            fetch(`http://localhost:3000/api/albuns/${albumId}/faixas`),
            fetch(`http://localhost:3000/api/albuns/${albumId}/resenhas`)
        ]);

        if (!resAlbum.ok || !resFaixas.ok || !resResenhas.ok) {
            throw new Error("Falha ao buscar dados do servidor");
        }

        const albuns = await resAlbum.json();
        const faixas = await resFaixas.json();
        const resenhas = await resResenhas.json();

        const album = albuns.find(a => a.id === albumId);
        
        if (!album) {
            detalhesTopo.innerHTML = '<h2>Álbum não encontrado.</h2>';
            return;
        }

        document.title = `${album.titulo} (${album.ano}) - Ressonance`;

        // 4. PREPARAÇÃO DOS DADOS
        const somaNotas = resenhas.reduce((soma, av) => soma + parseFloat(av.nota), 0);
        const media = resenhas.length > 0 ? (somaNotas / resenhas.length).toFixed(1) : "0.0";
        const imagemCapa = album.capa ? album.capa : 'img/placeholder.jpg';

        const listaDeMusicasHTML = faixas.length > 0 
            ? faixas.map(f => `<li><span class="numero-faixa">${f.numero_faixa}.</span> ${sanitizarHTML(f.titulo)}</li>`).join('')
            : '<li>Nenhuma faixa cadastrada.</li>';

        // 5. RENDERIZAÇÃO DO TOPO
        detalhesTopo.innerHTML = `
            <div class="cabecalho-detalhes">
                <div class="titulos-detalhes">
                    <h1 class="titulo-gigante">${sanitizarHTML(album.titulo)}</h1>
                    <p class="subtitulo-detalhes">${album.ano} • ${sanitizarHTML(album.artista)}</p>
                </div>
                <div class="avaliacao-detalhes">
                    <div class="nota-destaque">
                        <span class="estrela-grande">★</span>
                        <div class="numeros-nota">
                            <strong>${media}</strong><span class="nota-maxima">/5</span>
                            <div class="total-avaliacoes">${resenhas.length} avaliações</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="conteudo-principal-detalhes">
                <img src="${imagemCapa}" alt="Capa do álbum ${sanitizarHTML(album.titulo)}" class="capa-grande-img">
                <div class="informacoes-laterais">
                    <div class="tags-genero"><span class="tag">${sanitizarHTML(album.genero)}</span></div>
                    <div class="container-faixas">
                        <h3>Faixas</h3>
                        <ul class="lista-musicas">${listaDeMusicasHTML}</ul>
                    </div>
                    <div class="creditos-linha">
                        <strong>Artista principal</strong> <span>${sanitizarHTML(album.artista)}</span>
                    </div>
                </div>
            </div>
        `;

        // 6. RENDERIZAÇÃO DAS RESENHAS
        if (resenhas.length === 0) {
            listaResenhas.innerHTML = '<p class="sem-resenhas">Ainda não há avaliações para este álbum. Seja o primeiro a avaliar!</p>';
            return;
        }

        listaResenhas.innerHTML = '';
        resenhas.forEach(resenha => {
            const textoLimpo = sanitizarHTML(resenha.resenha);
            const autorLimpo = sanitizarHTML(resenha.autor);
            const notaNum = parseFloat(resenha.nota);

            const resenhaHTML = `
                <article class="cartao-resenha">
                    <div class="resenha-topo">
                        <span class="resenha-estrelas">★ ${notaNum.toFixed(1)}</span>
                        <span class="resenha-autor">${autorLimpo}</span>
                    </div>
                    <p class="resenha-texto">"${textoLimpo}"</p>
                </article>
            `;
            listaResenhas.innerHTML += resenhaHTML;
        });

    } catch (erro) {
        console.error("Erro ao carregar a página do álbum:", erro);
        detalhesTopo.innerHTML = '<h2 style="color:red;">Erro ao carregar detalhes do álbum.</h2>';
    }
});