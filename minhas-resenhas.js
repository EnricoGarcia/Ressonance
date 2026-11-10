document.addEventListener("DOMContentLoaded", async () => {
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');

    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('aberto');
        });
    }

    document.title = "Minhas Resenhas - Ressonance";

    const containerResenhas = document.getElementById('lista-minhas-resenhas');
    const token = localStorage.getItem('token');
    
    if (!token) {
        containerResenhas.innerHTML = '<p class="sem-resenhas">Faça login para ver o seu histórico de resenhas.</p>';
        return;
    }

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
            throw new Error(erroData.erro || `Falha na requisição. Código HTTP: ${resposta.status}`);
        }

        const minhasResenhas = await resposta.json();

        if (minhasResenhas.length === 0) {
            containerResenhas.innerHTML = '<p class="sem-resenhas">Você ainda não publicou nenhuma resenha.</p>';
            return;
        }

        containerResenhas.innerHTML = ''; 
        
        minhasResenhas.forEach(resenha => {
            const notaFormatada = parseFloat(resenha.nota).toFixed(1);
            const imagemCapa = resenha.album_capa ? resenha.album_capa : 'img/placeholder.jpg';

            const cardHTML = `
                <article class="nova-resenha-horizontal">
                    <div class="resenha-bloco-esquerdo">
                        <img src="${imagemCapa}" alt="Capa de ${resenha.album_titulo}" class="nova-capa-resenha">
                        <div class="resenha-info-titulos">
                            <h3 class="novo-titulo-album">${resenha.album_titulo}</h3>
                            <div class="nova-nota-album">
                                <span class="estrela-icone-grande">★</span>
                                <span class="texto-nota-fracao">(${notaFormatada}/5)</span>
                            </div>
                        </div>
                    </div>
                    <div class="resenha-bloco-direito">
                        <p class="novo-texto-resenha">"${resenha.resenha}"</p>
                    </div>
                </article>
            `;
            containerResenhas.innerHTML += cardHTML;
        });

    } catch (erro) {
        console.error("Erro exato da requisição:", erro);
        containerResenhas.innerHTML = `<p class="sem-resenhas" style="color: red;">${erro.message}</p>`;
    }
});