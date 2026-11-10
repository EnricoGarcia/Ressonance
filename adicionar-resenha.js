document.addEventListener("DOMContentLoaded", async () => {
    // 1. VERIFICAÇÃO DE LOGIN
    const perfilSalvo = JSON.parse(localStorage.getItem('usuarioPerfil'));
    const token = localStorage.getItem('token');
    
    if (!token || !perfilSalvo) {
        alert("Acesso negado. Por favor, faça login para adicionar uma resenha.");
        window.location.href = 'login.html';
        return;
    }

    document.title = "Adicionar Resenha - Ressonance";

    // 2. Lógica do Menu
    const btnMenu = document.getElementById('btn-menu');
    const menuLateral = document.getElementById('menu-lateral');
    if (btnMenu && menuLateral) {
        btnMenu.addEventListener('click', () => menuLateral.classList.toggle('aberto'));
    }

    // 3. CAPTURA DOS ELEMENTOS DO FORMULÁRIO (Ajustados para bater com o seu HTML)
    const formResenha = document.getElementById('form-resenha');
    const inputAlbumNome = document.getElementById('nome-album'); 
    const rangeNota = document.getElementById('nota');
    const displayNota = document.getElementById('valor-nota');
    const txtResenha = document.getElementById('texto-resenha');

    let albumSelecionadoId = null;
    let todosAlbuns = [];

    // 4. Criação da lista suspensa (Autocomplete)
    const listaAutocomplete = document.createElement('div');
    listaAutocomplete.classList.add('lista-autocomplete');
    
    const wrapperInput = document.createElement('div');
    wrapperInput.style.position = 'relative';
    wrapperInput.style.width = '100%';
    
    inputAlbumNome.parentNode.insertBefore(wrapperInput, inputAlbumNome);
    wrapperInput.appendChild(inputAlbumNome);
    wrapperInput.appendChild(listaAutocomplete);

    // Atualiza a exibição da nota ao mover a barra
    rangeNota.addEventListener('input', (e) => {
        displayNota.textContent = parseFloat(e.target.value).toFixed(1);
    });

    // 5. CARREGAR ÁLBUNS DO BACKEND
    try {
        const resposta = await fetch('http://localhost:3000/api/albuns');
        if (resposta.ok) {
            todosAlbuns = await resposta.json();
            
            // VERIFICA SE O USUÁRIO VEIO DE UMA PÁGINA DE ÁLBUM ESPECÍFICO
            const params = new URLSearchParams(window.location.search);
            const idAlbumURL = params.get('id');

            if (idAlbumURL) {
                const albumVindoDaUrl = todosAlbuns.find(a => a.id === parseInt(idAlbumURL));
                if (albumVindoDaUrl) {
                    // Preenche automaticamente e trava o input
                    inputAlbumNome.value = `${albumVindoDaUrl.titulo} (${albumVindoDaUrl.artista})`;
                    inputAlbumNome.readOnly = true; 
                    inputAlbumNome.style.backgroundColor = '#333';
                    inputAlbumNome.style.cursor = 'not-allowed';
                    albumSelecionadoId = albumVindoDaUrl.id;
                }
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar a lista de álbuns:", erro);
    }

    // 6. LÓGICA DE FILTRO E AUTOCOMPLETE
    inputAlbumNome.addEventListener('input', (e) => {
        if (inputAlbumNome.readOnly) return;

        const termo = e.target.value.toLowerCase();
        listaAutocomplete.innerHTML = '';
        albumSelecionadoId = null;

        if (termo.trim().length === 0) {
            listaAutocomplete.style.display = 'none';
            return;
        }

        const filtrados = todosAlbuns
            .filter(album => album.titulo.toLowerCase().includes(termo) || album.artista.toLowerCase().includes(termo))
            .sort((a, b) => a.titulo.localeCompare(b.titulo));

        if (filtrados.length > 0) {
            listaAutocomplete.style.display = 'block';
            filtrados.forEach(album => {
                const item = document.createElement('div');
                item.classList.add('item-autocomplete');
                item.textContent = `${album.titulo} - ${album.artista}`;
                
                item.addEventListener('click', () => {
                    inputAlbumNome.value = `${album.titulo} - ${album.artista}`;
                    albumSelecionadoId = album.id;
                    listaAutocomplete.style.display = 'none'; 
                });
                
                listaAutocomplete.appendChild(item);
            });
        } else {
            listaAutocomplete.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== inputAlbumNome && e.target !== listaAutocomplete) {
            listaAutocomplete.style.display = 'none';
        }
    });

    // 7. ENVIAR RESENHA PARA O SERVIDOR (API)
    formResenha.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!albumSelecionadoId) {
            alert('Por favor, selecione um álbum válido da lista suspensa.');
            return;
        }

        const notaEnviada = parseFloat(rangeNota.value);
        const resenhaEnviada = txtResenha.value.trim();

        if (resenhaEnviada === '') {
            alert('Por favor, escreva o texto da resenha.');
            return;
        }

        try {
            const resposta = await fetch('http://localhost:3000/api/resenhas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    album_id: albumSelecionadoId,
                    nota: notaEnviada,
                    resenha: resenhaEnviada
                })
            });

            if (resposta.ok) {
                alert("Resenha publicada com sucesso!");
                window.location.href = `album.html?id=${albumSelecionadoId}`;
            } else {
                const erro = await resposta.json();
                alert(`Erro ao publicar resenha: ${erro.erro || 'Falha na comunicação'}`);
            }
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            alert("Erro ao tentar conectar ao servidor.");
        }
    });
});