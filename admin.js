document.addEventListener("DOMContentLoaded", () => {
    const formAlbum = document.getElementById('form-album');
    const divMensagem = document.getElementById('mensagem-retorno');

    // Verifica se o utilizador está logado antes de mostrar o form
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Acesso negado. Faça login como administrador.");
        window.location.href = 'index.html'; 
        return;
    }

    formAlbum.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        
        const titulo = document.getElementById('titulo').value;
        const artista = document.getElementById('artista').value;
        const ano = parseInt(document.getElementById('ano').value);
        const genero = document.getElementById('genero').value;
        const capa = document.getElementById('capa').value;

        const novoAlbum = { titulo, artista, ano, genero, capa };

        try {
            const resposta = await fetch('http://localhost:3000/api/albuns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(novoAlbum)
            });

            if (resposta.ok) {
                const dados = await resposta.json();
                divMensagem.innerHTML = `<p style="color: green;">Álbum '${titulo}' cadastrado com sucesso! ID: ${dados.id}</p>`;
                formAlbum.reset(); 
                
            } else {
                const erro = await resposta.json();
                divMensagem.innerHTML = `<p style="color: red;">Erro: ${erro.erro || 'Não autorizado'}</p>`;
            }
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            divMensagem.innerHTML = `<p style="color: red;">Erro ao tentar conectar ao servidor.</p>`;
        }
    });
});