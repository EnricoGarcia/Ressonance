document.addEventListener("DOMContentLoaded", async () => {
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');

    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => menuLateral.classList.toggle('aberto'));
    }

    document.title = "Minhas Resenhas - Ressonance";

    const { escapeHTML, safeImageURL } = window.RessonanceUI;
    const containerResenhas = document.getElementById('lista-minhas-resenhas');
    const filtroNome = document.getElementById('filtro-nome');
    const filtroGenero = document.getElementById('filtro-genero');
    
    const token = localStorage.getItem('token');
    if (!token) {
        containerResenhas.innerHTML = '<p class="sem-resenhas">Faça login para ver o seu histórico.</p>';
        return;
    }

    let todasMinhasResenhas = [];

    try {
        const resposta = await fetch('http://localhost:3000/api/resenhas/minhas', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (!resposta.ok) {
            const erroData = await resposta.json().catch(() => ({}));
            throw new Error(erroData.erro || `Falha na requisição. Código: ${resposta.status}`);
        }

        todasMinhasResenhas = await resposta.json();

        if (todasMinhasResenhas.length === 0) {
            containerResenhas.innerHTML = '<p class="sem-resenhas">Você ainda não publicou nenhuma resenha.</p>';
            return;
        }

        popularFiltros(todasMinhasResenhas);
        renderizarResenhas(todasMinhasResenhas);

    } catch (erro) {
        containerResenhas.innerHTML = `<p class="sem-resenhas" style="color: red;">${escapeHTML(erro.message)}</p>`;
    }

    function popularFiltros(resenhas) {
        if (!filtroNome || !filtroGenero) return;
        
        const nomesUnicos = [...new Set(resenhas.map(r => r.album_titulo))].sort();
        filtroNome.innerHTML = '<option value="">Todos os Álbuns</option>';
        nomesUnicos.forEach(nome => { filtroNome.innerHTML += `<option value="${escapeHTML(nome)}">${escapeHTML(nome)}</option>`; });

        // Coleta apenas os gêneros existentes nos álbuns resenhados pelo usuário
        const generosPresentes = resenhas.map(r => r.album_genero).filter(g => g);
        const generosUnicos = [...new Set(generosPresentes)].sort();
        filtroGenero.innerHTML = '<option value="">Todos os Gêneros</option>';
        generosUnicos.forEach(genero => { filtroGenero.innerHTML += `<option value="${escapeHTML(genero)}">${escapeHTML(genero)}</option>`; });
    }

    function aplicarFiltros() {
        if (!filtroNome || !filtroGenero) return;
        const n = filtroNome.value;
        const g = filtroGenero.value;

        let filtrados = todasMinhasResenhas.filter(r => {
            const passaNome = n === "" || r.album_titulo === n;
            const passaGenero = g === "" || r.album_genero === g;
            return passaNome && passaGenero;
        });
        renderizarResenhas(filtrados);
    }

    if (filtroNome && filtroGenero) {
        filtroNome.addEventListener('change', aplicarFiltros);
        filtroGenero.addEventListener('change', aplicarFiltros);
    }

    function renderizarResenhas(lista) {
        containerResenhas.innerHTML = ''; 
        if(lista.length === 0) {
            containerResenhas.innerHTML = '<p class="sem-resenhas" style="color: #000;">Nenhuma resenha encontrada para os filtros selecionados.</p>';
            return;
        }

        lista.forEach(resenha => {
            const notaFormatada = parseFloat(resenha.nota).toFixed(1);
            const imagemCapa = safeImageURL(resenha.album_capa);

            const cardHTML = `
                <article class="nova-resenha-horizontal">
                    <div class="resenha-bloco-esquerdo">
                        <img src="${escapeHTML(imagemCapa)}" alt="Capa de ${escapeHTML(resenha.album_titulo)}" class="nova-capa-resenha">
                        <div class="resenha-info-titulos">
                            <h3 class="novo-titulo-album">${escapeHTML(resenha.album_titulo)}</h3>
                            <div class="nova-nota-album">
                                <span class="estrela-icone-grande">★</span>
                                <span class="texto-nota-fracao">(${notaFormatada}/5)</span>
                            </div>
                        </div>
                    </div>
                    <div class="resenha-bloco-direito">
                        <p class="novo-texto-resenha">"${escapeHTML(resenha.resenha)}"</p>
                    </div>
                </article>
            `;
            containerResenhas.innerHTML += cardHTML;
        });
    }
});