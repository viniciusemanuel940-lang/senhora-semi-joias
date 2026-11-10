        // ===== Abertura =====
        const abertura = document.querySelector('.abertura');
        const diamante = document.querySelector('.diamante');

        diamante.addEventListener('click', function () {
            abertura.classList.add('escondida');
        });

        // ===== Menu lateral (celular) =====
        const botaoMenu = document.getElementById('botao-menu');
        const lateral = document.getElementById('lateral');
        const sombra = document.getElementById('sombra');

        function abrirMenu() {
            lateral.classList.add('aberta');
            sombra.classList.add('visivel');
        }

        function fecharMenu() {
            lateral.classList.remove('aberta');
            sombra.classList.remove('visivel');
        }

        botaoMenu.addEventListener('click', abrirMenu);
        sombra.addEventListener('click', fecharMenu);

        // ===== Trocar de tela =====
        const telas = document.querySelectorAll('.tela');
        const botoesMenu = document.querySelectorAll('.lateral button');

        function mostrarTela(id) {
            telas.forEach(function (tela) {
                tela.classList.remove('ativa');
            });
            document.getElementById(id).classList.add('ativa');

            const destaque = id === 'tela-ficha' ? 'tela-clientes' : id;
            botoesMenu.forEach(function (botao) {
                botao.classList.toggle('ativo', botao.dataset.tela === destaque);
            });

            window.scrollTo(0, 0);
        }

        botoesMenu.forEach(function (botao) {
            botao.addEventListener('click', function () {
                mostrarTela(botao.dataset.tela);
                fecharMenu();
            });
        });

        // ===== Ajudantes =====
        function criar(tag, classe, texto) {
            const elemento = document.createElement(tag);
            if (classe) elemento.className = classe;
            if (texto !== undefined) elemento.textContent = texto;
            return elemento;
        }

        function carregarLista(chave) {
            try {
                return JSON.parse(localStorage.getItem(chave)) || [];
            } catch (erro) {
                return [];
            }
        }

        function formatarReais(valor) {
            return Number(valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }

        function arredondar(numero) {
            return Math.round(numero * 100) / 100;
        }

        function somar(lista, campo) {
            return arredondar(lista.reduce(function (total, item) {
                return total + item[campo];
            }, 0));
        }

        function doisDigitos(numero) {
            return String(numero).padStart(2, '0');
        }

        function hoje() {
            const agora = new Date();
            return agora.getFullYear() + '-' +
                doisDigitos(agora.getMonth() + 1) + '-' +
                doisDigitos(agora.getDate());
        }

        function formatarData(texto) {
            if (!texto) return '';
            const partes = texto.split('-');
            return partes[2] + '/' + partes[1] + '/' + partes[0];
        }

        function mostrarPrevia(imagem, foto) {
            if (foto) {
                imagem.src = foto;
                imagem.hidden = false;
            } else {
                imagem.hidden = true;
                imagem.removeAttribute('src');
            }
        }

        function reduzirFoto(arquivo) {
            return new Promise(function (resolver, rejeitar) {
                const leitor = new FileReader();

                leitor.onload = function () {
                    const imagem = new Image();

                    imagem.onload = function () {
                        const maximo = 600;
                        const escala = Math.min(
                            1,
                            maximo / Math.max(imagem.width, imagem.height)
                        );

                        const quadro = document.createElement('canvas');
                        quadro.width = Math.round(imagem.width * escala);
                        quadro.height = Math.round(imagem.height * escala);

                        quadro.getContext('2d').drawImage(
                            imagem, 0, 0, quadro.width, quadro.height
                        );

                        resolver(quadro.toDataURL('image/jpeg', 0.7));
                    };

                    imagem.onerror = rejeitar;
                    imagem.src = leitor.result;
                };

                leitor.onerror = rejeitar;
                leitor.readAsDataURL(arquivo);
            });
        }

        // ===== Dados =====
        function carregarClientes() {
            const lista = carregarLista('clientes');

            lista.forEach(function (cliente, posicao) {
                if (!cliente.id) cliente.id = Date.now() + posicao;
                cliente.pecas = cliente.pecas || [];
                cliente.pagamentos = cliente.pagamentos || [];
            });

            return lista;
        }

        let clientes = carregarClientes();
        let pecas = carregarLista('pecas');

        function salvarClientes() {
            try {
                localStorage.setItem('clientes', JSON.stringify(clientes));
                return true;
            } catch (erro) {
                alert('Não coube no celular. Use fotos menores ou exclua peças antigas.');
                clientes = carregarClientes();
                return false;
            }
        }

        function salvarPecas() {
            try {
                localStorage.setItem('pecas', JSON.stringify(pecas));
                return true;
            } catch (erro) {
                alert('Não coube no celular. Use uma foto menor ou exclua peças antigas.');
                return false;
            }
        }

        function buscarCliente(id) {
            return clientes.find(function (cliente) {
                return cliente.id === id;
            });
        }

        function totalVendido(cliente) {
            return somar(cliente.pecas, 'preco');
        }

        function totalPago(cliente) {
            return somar(cliente.pagamentos, 'valor');
        }

        function quantoFalta(cliente) {
            return arredondar(totalVendido(cliente) - totalPago(cliente));
        }

                // ===== Linha de cliente (usada em várias listas) =====
        function linhaCliente(cliente) {
            const item = criar('li', 'item clicavel');
            const avatar = criar('div', 'avatar', cliente.nome.charAt(0).toUpperCase());

            const info = criar('div', 'item-info');
            const quantidade = cliente.pecas.length;

            info.append(
                criar('div', 'item-titulo', cliente.nome),
                criar(
                    'div',
                    'item-sub',
                    quantidade + (quantidade === 1 ? ' peça' : ' peças') +
                    ' • pago ' + formatarReais(totalPago(cliente))
                )
            );

            const falta = quantoFalta(cliente);
            const valor = criar(
                'div',
                'item-valor',
                falta > 0 ? 'Falta ' + formatarReais(falta) : 'Em dia'
            );

            if (falta <= 0) valor.classList.add('em-dia');

            item.append(avatar, info, valor);
            item.addEventListener('click', function () {
                abrirFicha(cliente.id);
            });

            return item;
        }

        // ===== Adicionar cliente =====
        const formCliente = document.getElementById('form-cliente');
        const campoNome = document.getElementById('nome-cliente');
        const campoTelefone = document.getElementById('telefone-cliente');
        function formatarTelefone(texto) {
    const numeros = texto.replace(/\D/g, '').slice(0, 11);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 7) {
        return '(' + numeros.slice(0, 2) + ') ' + numeros.slice(2);
    }

    return '(' + numeros.slice(0, 2) + ') ' +
        numeros.slice(2, 7) + '-' + numeros.slice(7);
}

campoTelefone.addEventListener('input', function () {
    campoTelefone.value = formatarTelefone(campoTelefone.value);
});
        const avisoCliente = document.getElementById('aviso-cliente');
        const tituloAdicionar = document.getElementById('titulo-adicionar');
        const vazioAdicionar = document.getElementById('vazio-adicionar');
        const listaAdicionar = document.getElementById('lista-adicionar');

        function mostrarListaAdicionar() {
            tituloAdicionar.textContent =
                'Clientes cadastradas (' + clientes.length + ')';
            vazioAdicionar.hidden = clientes.length > 0;
            listaAdicionar.replaceChildren();

            clientes.slice().reverse().forEach(function (cliente) {
                listaAdicionar.append(linhaCliente(cliente));
            });
        }

        formCliente.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const nome = campoNome.value.trim();
            if (nome === '') return;
            const telefone = campoTelefone.value.trim();

            clientes.push({
                id: Date.now(),
                nome: nome,
                telefone: telefone,
                pecas: [],
                pagamentos: []
            });

            salvarClientes();
            atualizarTudo();

            avisoCliente.textContent = 'Cliente adicionada: ' + nome;
            avisoCliente.hidden = false;

            campoNome.value = '';
            campoTelefone.value = '';
            campoNome.focus();
        });

        // ===== Lista de clientes =====
        const campoBuscaCliente = document.getElementById('busca-cliente');
        const semClientes = document.getElementById('sem-clientes');
        const listaClientes = document.getElementById('lista-clientes');

        function mostrarClientes() {
            const termo = campoBuscaCliente.value.trim().toLowerCase();
            const filtradas = clientes.filter(function (cliente) {
                return cliente.nome.toLowerCase().includes(termo);
            });

            semClientes.textContent = clientes.length === 0
                ? 'Nenhuma cliente cadastrada ainda.'
                : 'Nenhuma cliente encontrada.';
            semClientes.hidden = filtradas.length > 0;

            listaClientes.replaceChildren();
            filtradas.forEach(function (cliente) {
                listaClientes.append(linhaCliente(cliente));
            });
        }

        campoBuscaCliente.addEventListener('input', mostrarClientes);

        // ===== A receber =====
        const totalReceber = document.getElementById('total-receber');
        const vazioReceber = document.getElementById('vazio-receber');
        const listaReceber = document.getElementById('lista-receber');

        function mostrarReceber() {
            const devedoras = clientes.filter(function (cliente) {
                return quantoFalta(cliente) > 0;
            }).sort(function (a, b) {
                return quantoFalta(b) - quantoFalta(a);
            });

            const soma = devedoras.reduce(function (total, cliente) {
                return total + quantoFalta(cliente);
            }, 0);

            totalReceber.textContent = formatarReais(arredondar(soma));
            vazioReceber.hidden = devedoras.length > 0;
            listaReceber.replaceChildren();

            devedoras.forEach(function (cliente) {
                const item = linhaCliente(cliente);
                const acoes = criar('div', 'item-acoes');
                const botao = criar('button', 'mini', '+ Pagamento');

                botao.type = 'button';
                botao.addEventListener('click', function (evento) {
                    evento.stopPropagation();
                    abrirFicha(cliente.id, true);
                });

                acoes.append(botao);
                item.append(acoes);
                listaReceber.append(item);
            });
        }

                // ===== Ficha da cliente =====
        const fichaNome = document.getElementById('ficha-nome');
        const fichaTelefone = document.getElementById('ficha-telefone');
        const fichaQtd = document.getElementById('ficha-qtd');
        const fichaTotal = document.getElementById('ficha-total');
        const fichaPago = document.getElementById('ficha-pago');
        const fichaFalta = document.getElementById('ficha-falta');
        const voltarClientes = document.getElementById('voltar-clientes');
        const botaoEditarCliente = document.getElementById('editar-cliente');
        const botaoExcluirCliente = document.getElementById('excluir-cliente');
        const botaoCobrar = document.getElementById('cobrar-whatsapp');
        const formPecaCliente = document.getElementById('form-peca-cliente');
        const selectCatalogo = document.getElementById('escolher-catalogo');
        const campoFotoCliente = document.getElementById('foto-peca-cliente');
        const previaPecaCliente = document.getElementById('previa-peca-cliente');
        const campoNomePecaCliente = document.getElementById('nome-peca-cliente');
        const sugestoesPecas = document.getElementById('sugestoes-pecas');
        const campoPrecoPecaCliente = document.getElementById('preco-peca-cliente');
        const campoDataPecaCliente = document.getElementById('data-peca-cliente');
        const botaoPecaCliente = document.getElementById('botao-peca-cliente');
        const cancelarPecaCliente = document.getElementById('cancelar-peca-cliente');
        const vazioPecasCliente = document.getElementById('vazio-pecas-cliente');
        const listaPecasCliente = document.getElementById('lista-pecas-cliente');
        const campoFormaPagamento = document.getElementById('forma-pagamento');
        const formPagamento = document.getElementById('form-pagamento');
        const campoValorPagamento = document.getElementById('valor-pagamento');
        const campoDataPagamento = document.getElementById('data-pagamento');

        const botaoPagamento = document.getElementById('botao-pagamento');
        const cancelarPagamento = document.getElementById('cancelar-pagamento');
        const vazioPagamentos = document.getElementById('vazio-pagamentos');
        const listaPagamentos = document.getElementById('lista-pagamentos');

        let clienteAtualId = null;
        let editandoPecaClienteId = null;
        let editandoPagamentoId = null;
        let fotoCliente = '';

        function preencherCatalogo() {
            selectCatalogo.replaceChildren(new Option('— nenhuma —', ''));

            pecas.forEach(function (peca) {
                selectCatalogo.append(
                    new Option(
                        peca.nome + ' — ' + formatarReais(peca.preco),
                        peca.id
                    )
                );
            });

            sugestoesPecas.replaceChildren();

pecas.forEach(function (peca) {
    const opcao = criar('option');
    opcao.value = peca.nome;
    sugestoesPecas.append(opcao);
});

        }

        function limparFormPecaCliente() {
            formPecaCliente.reset();
            fotoCliente = '';
            mostrarPrevia(previaPecaCliente, '');
            campoDataPecaCliente.value = hoje();
            editandoPecaClienteId = null;
            botaoPecaCliente.textContent = 'Anotar peça';
            cancelarPecaCliente.hidden = true;
        }

        function limparFormPagamento() {
            formPagamento.reset();
            campoDataPagamento.value = hoje();
            editandoPagamentoId = null;
            botaoPagamento.textContent = 'Anotar pagamento';
            cancelarPagamento.hidden = true;
        }

        function abrirFicha(id, focarPagamento) {
            clienteAtualId = id;
            limparFormPecaCliente();
            limparFormPagamento();
            mostrarFicha();
            mostrarTela('tela-ficha');

            if (focarPagamento) campoValorPagamento.focus();
        }

        function mostrarFicha() {
            const cliente = buscarCliente(clienteAtualId);
            if (!cliente) return;

            fichaNome.textContent = cliente.nome;
            fichaTelefone.textContent = cliente.telefone || 'Sem telefone cadastrado';
            fichaQtd.textContent = cliente.pecas.length;
            fichaTotal.textContent = formatarReais(totalVendido(cliente));
            fichaPago.textContent = formatarReais(totalPago(cliente));
            fichaFalta.textContent =
                formatarReais(Math.max(0, quantoFalta(cliente)));

            // Peças da cliente
            vazioPecasCliente.hidden = cliente.pecas.length > 0;
            listaPecasCliente.replaceChildren();

            cliente.pecas.forEach(function (peca) {
                const item = criar('li', 'item');

                if (peca.foto) {
                    const foto = criar('img', 'item-foto');
                    foto.src = peca.foto;
                    foto.alt = peca.nome;
                    item.append(foto);
                }

                const info = criar('div', 'item-info');
                info.append(
                    criar('div', 'item-titulo', peca.nome),
                    criar('div', 'item-sub', formatarData(peca.data))
                );

                const valor = criar(
                    'div',
                    'item-valor',
                    formatarReais(peca.preco)
                );

                const acoes = criar('div', 'item-acoes');

                const editar = criar('button', 'mini', 'Editar');
                editar.type = 'button';
                editar.addEventListener('click', function () {
                    editarPecaDaCliente(cliente.id, peca.id);
                });

                const excluir = criar('button', 'mini perigo', 'Excluir');
                excluir.type = 'button';
                excluir.addEventListener('click', function () {
                    excluirPecaDaCliente(peca.id);
                });

                acoes.append(editar, excluir);
                item.append(info, valor, acoes);
                listaPecasCliente.append(item);
            });

            // Pagamentos da cliente
            vazioPagamentos.hidden = cliente.pagamentos.length > 0;
            listaPagamentos.replaceChildren();

            cliente.pagamentos.forEach(function (pagamento) {
                const item = criar('li', 'item');
                const info = criar('div', 'item-info');

                info.append(
                    criar('div', 'item-titulo', formatarReais(pagamento.valor)),
                   criar(
                        'div',
                     'item-sub',
                       formatarData(pagamento.data) +
                       (pagamento.forma ? ' • ' + pagamento.forma : '')
                  )
                );

                const acoes = criar('div', 'item-acoes');

                const editar = criar('button', 'mini', 'Editar');
                editar.type = 'button';
                editar.addEventListener('click', function () {
                    editarPagamento(pagamento.id);
                });

                const excluir = criar('button', 'mini perigo', 'Excluir');
                excluir.type = 'button';
                excluir.addEventListener('click', function () {
                    excluirPagamento(pagamento.id);
                });

                acoes.append(editar, excluir);
                item.append(info, acoes);
                listaPagamentos.append(item);
            });
        }

        voltarClientes.addEventListener('click', function () {
            mostrarTela('tela-clientes');
        });

        botaoEditarCliente.addEventListener('click', function () {
            const cliente = buscarCliente(clienteAtualId);
            if (!cliente) return;

            const novoNome = prompt('Novo nome da cliente:', cliente.nome);
            if (novoNome === null) return;

            const nome = novoNome.trim();
            if (nome === '') return;

            cliente.nome = nome;
            salvarClientes();
            atualizarTudo();
        });

        botaoExcluirCliente.addEventListener('click', function () {
            if (!confirm('Excluir esta cliente e tudo o que foi anotado nela?')) {
                return;
            }

            clientes = clientes.filter(function (cliente) {
                return cliente.id !== clienteAtualId;
            });

            salvarClientes();
            clienteAtualId = null;
            atualizarTudo();
            mostrarTela('tela-clientes');
        });


        botaoCobrar.addEventListener('click', function () {
    const cliente = buscarCliente(clienteAtualId);
    if (!cliente) return;

    const numeros = (cliente.telefone || '').replace(/\D/g, '');
    if (numeros === '') {
        alert('Esta cliente não tem telefone cadastrado.');
        return;
    }

    const falta = quantoFalta(cliente);
    if (falta <= 0) {
        alert('Esta cliente não tem valor em aberto.');
        return;
    }

const forma = (campoFormaPagamento.value || '').trim().toLowerCase();
const usaPix = forma.includes('pix');

const instrucoesPagamento = usaPix
    ? 'Você pode pagar pelo Pix usando esta chave: (17) 99193-3340.'
    : 'Se preferir outra forma de pagamento, me avise para combinarmos.';

const mensagem = 'Olá, ' + cliente.nome + '! Tudo bem? ' +
    'Ficou um valor de ' + formatarReais(falta) + ' em aberto. ' +
    instrucoesPagamento + ' Obrigada!';

const link = 'https://wa.me/55' + numeros +
    '?text=' + encodeURIComponent(mensagem);

window.open(link, '_blank');
});



                // --- Peças da cliente ---
        campoFotoCliente.addEventListener('change', async function () {
            const arquivo = campoFotoCliente.files[0];
            if (!arquivo) return;

            try {
                fotoCliente = await reduzirFoto(arquivo);
                mostrarPrevia(previaPecaCliente, fotoCliente);
            } catch (erro) {
                alert('Não consegui ler essa foto. Tente outra.');
            }
        });

        selectCatalogo.addEventListener('change', function () {
            const id = Number(selectCatalogo.value);
            const peca = pecas.find(function (p) {
                return p.id === id;
            });

    

            if (!peca) return;

            campoNomePecaCliente.value = peca.nome;
            campoPrecoPecaCliente.value = peca.preco;
            fotoCliente = peca.foto || '';
            mostrarPrevia(previaPecaCliente, fotoCliente);
        });

        campoNomePecaCliente.addEventListener('input', function () {
    const digitado = campoNomePecaCliente.value.trim().toLowerCase();

    const peca = pecas.find(function (p) {
        return p.nome.trim().toLowerCase() === digitado;
    });

    if (!peca) return;

    campoPrecoPecaCliente.value = peca.preco;
    fotoCliente = peca.foto || '';
    mostrarPrevia(previaPecaCliente, fotoCliente);
});

        function editarPecaDaCliente(clienteId, pecaId) {
            abrirFicha(clienteId);

            const cliente = buscarCliente(clienteId);
            const peca = cliente.pecas.find(function (p) {
                return p.id === pecaId;
            });

            if (!peca) return;

            editandoPecaClienteId = pecaId;
            campoNomePecaCliente.value = peca.nome;
            campoPrecoPecaCliente.value = peca.preco;
            campoDataPecaCliente.value = peca.data || hoje();
            fotoCliente = peca.foto || '';
            mostrarPrevia(previaPecaCliente, fotoCliente);

            botaoPecaCliente.textContent = 'Salvar alterações';
            cancelarPecaCliente.hidden = false;
            formPecaCliente.scrollIntoView({ behavior: 'smooth' });
        }

        function excluirPecaDaCliente(pecaId) {
            if (!confirm('Excluir esta peça da cliente?')) return;

            const cliente = buscarCliente(clienteAtualId);
            cliente.pecas = cliente.pecas.filter(function (p) {
                return p.id !== pecaId;
            });

            salvarClientes();
            atualizarTudo();

            if (editandoPecaClienteId === pecaId) {
                limparFormPecaCliente();
            }
        }

        formPecaCliente.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const cliente = buscarCliente(clienteAtualId);
            if (!cliente) return;

            const nome = campoNomePecaCliente.value.trim();
            if (nome === '') return;

            const dados = {
                nome: nome,
                preco: Number(campoPrecoPecaCliente.value) || 0,
                foto: fotoCliente,
                data: campoDataPecaCliente.value || hoje()
            };

            if (editandoPecaClienteId === null) {
                dados.id = Date.now();
                cliente.pecas.push(dados);
            } else {
                const peca = cliente.pecas.find(function (p) {
                    return p.id === editandoPecaClienteId;
                });
                Object.assign(peca, dados);
            }

            const salvou = salvarClientes();
            atualizarTudo();

            if (salvou) limparFormPecaCliente();
        });

        cancelarPecaCliente.addEventListener('click', limparFormPecaCliente);

        // --- Pagamentos da cliente ---
        function editarPagamento(pagamentoId) {
            const cliente = buscarCliente(clienteAtualId);
            const pagamento = cliente.pagamentos.find(function (p) {
                return p.id === pagamentoId;
            });

            if (!pagamento) return;

            editandoPagamentoId = pagamentoId;
            campoValorPagamento.value = pagamento.valor;
            campoDataPagamento.value = pagamento.data || hoje();
            campoFormaPagamento.value = pagamento.forma || 'pix';

            botaoPagamento.textContent = 'Salvar alterações';
            cancelarPagamento.hidden = false;
            formPagamento.scrollIntoView({ behavior: 'smooth' });
        }

        function excluirPagamento(pagamentoId) {
            if (!confirm('Excluir este pagamento?')) return;

            const cliente = buscarCliente(clienteAtualId);
            cliente.pagamentos = cliente.pagamentos.filter(function (p) {
                return p.id !== pagamentoId;
            });

            salvarClientes();
            atualizarTudo();

            if (editandoPagamentoId === pagamentoId) {
                limparFormPagamento();
            }
        }

        formPagamento.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const cliente = buscarCliente(clienteAtualId);
            if (!cliente) return;

            const valor = Number(campoValorPagamento.value);
            if (!(valor > 0)) return;

            const dados = {
                valor: valor,
                data: campoDataPagamento.value || hoje(),
                forma: campoFormaPagamento.value
            };

            if (editandoPagamentoId === null) {
                dados.id = Date.now();
                cliente.pagamentos.push(dados);
            } else {
                const pagamento = cliente.pagamentos.find(function (p) {
                    return p.id === editandoPagamentoId;
                });
                Object.assign(pagamento, dados);
            }

            const salvou = salvarClientes();
            atualizarTudo();

            if (salvou) limparFormPagamento();
        });

        cancelarPagamento.addEventListener('click', limparFormPagamento);

                // ===== Vendas =====
        const NOMES_MESES = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];

        const vendidoMes = document.getElementById('vendido-mes');
        const recebidoMes = document.getElementById('recebido-mes');
        const vendidoTotal = document.getElementById('vendido-total');
        const vendasFalta = document.getElementById('vendas-falta');
        const grafico = document.getElementById('grafico');
        const tabelaMeses = document.getElementById('tabela-meses');
        const vazioVendas = document.getElementById('vazio-vendas');
        const listaVendas = document.getElementById('lista-vendas');

        function chaveDoMes(data) {
            return data.slice(0, 7);
        }

        function somarDoMes(lista, campo, chave) {
            const doMes = lista.filter(function (item) {
                return item.data && chaveDoMes(item.data) === chave;
            });

            return somar(doMes, campo);
        }

        function mostrarVendas() {
            const vendas = [];
            const todasPecas = [];
            const todosPagamentos = [];

            clientes.forEach(function (cliente) {
                cliente.pecas.forEach(function (peca) {
                    vendas.push({ cliente: cliente, peca: peca });
                    todasPecas.push(peca);
                });

                cliente.pagamentos.forEach(function (pagamento) {
                    todosPagamentos.push(pagamento);
                });
            });

            const agora = new Date();
            const mesAtual = agora.getFullYear() + '-' +
                doisDigitos(agora.getMonth() + 1);

            vendidoMes.textContent = formatarReais(
                somarDoMes(todasPecas, 'preco', mesAtual)
            );
            recebidoMes.textContent = formatarReais(
                somarDoMes(todosPagamentos, 'valor', mesAtual)
            );
            vendidoTotal.textContent = formatarReais(
                somar(todasPecas, 'preco')
            );

            const faltaGeral = clientes.reduce(function (total, cliente) {
                return total + Math.max(0, quantoFalta(cliente));
            }, 0);

            vendasFalta.textContent = formatarReais(arredondar(faltaGeral));

            // Últimos 6 meses
            const meses = [];

            for (let i = 5; i >= 0; i--) {
                const dia = new Date(
                    agora.getFullYear(),
                    agora.getMonth() - i,
                    1
                );

                const chave = dia.getFullYear() + '-' +
                    doisDigitos(dia.getMonth() + 1);

                meses.push({
                    nome: NOMES_MESES[dia.getMonth()],
                    rotulo: NOMES_MESES[dia.getMonth()] + '/' +
                        String(dia.getFullYear()).slice(2),
                    vendido: somarDoMes(todasPecas, 'preco', chave),
                    recebido: somarDoMes(todosPagamentos, 'valor', chave)
                });
            }

            const maior = Math.max(
                1,
                ...meses.map(function (mes) {
                    return Math.max(mes.vendido, mes.recebido);
                })
            );

            grafico.replaceChildren();

            meses.forEach(function (mes) {
                const coluna = criar('div', 'coluna-mes');
                const barras = criar('div', 'barras');

                const barraVendido = criar('div', 'barra vendido');
                barraVendido.style.height =
                    (mes.vendido / maior * 100) + '%';
                barraVendido.title =
                    'Vendido: ' + formatarReais(mes.vendido);

                const barraRecebido = criar('div', 'barra recebido');
                barraRecebido.style.height =
                    (mes.recebido / maior * 100) + '%';
                barraRecebido.title =
                    'Recebido: ' + formatarReais(mes.recebido);

                barras.append(barraVendido, barraRecebido);
                coluna.append(
                    barras,
                    criar('div', 'rotulo-mes', mes.nome)
                );
                grafico.append(coluna);
            });

            tabelaMeses.replaceChildren();

            meses.slice().reverse().forEach(function (mes) {
                const linha = criar('tr');

                linha.append(
                    criar('td', '', mes.rotulo),
                    criar('td', '', formatarReais(mes.vendido)),
                    criar('td', '', formatarReais(mes.recebido))
                );

                tabelaMeses.append(linha);
            });

            // Últimas vendas
            vendas.sort(function (a, b) {
                return (b.peca.data || '').localeCompare(a.peca.data || '') ||
                    b.peca.id - a.peca.id;
            });

            vazioVendas.hidden = vendas.length > 0;
            listaVendas.replaceChildren();

            vendas.slice(0, 15).forEach(function (venda) {
                const item = criar('li', 'item');

                if (venda.peca.foto) {
                    const foto = criar('img', 'item-foto');
                    foto.src = venda.peca.foto;
                    foto.alt = venda.peca.nome;
                    item.append(foto);
                }

                const info = criar('div', 'item-info');
                info.append(
                    criar('div', 'item-titulo', venda.peca.nome),
                    criar(
                        'div',
                        'item-sub',
                        venda.cliente.nome + ' • ' +
                        formatarData(venda.peca.data)
                    )
                );

                const valor = criar(
                    'div',
                    'item-valor',
                    formatarReais(venda.peca.preco)
                );

                const acoes = criar('div', 'item-acoes');
                const editar = criar('button', 'mini', 'Editar');
                editar.type = 'button';
                editar.addEventListener('click', function () {
                    editarPecaDaCliente(venda.cliente.id, venda.peca.id);
                });

                acoes.append(editar);
                item.append(info, valor, acoes);
                listaVendas.append(item);
            });
        }
                // ===== Peças do catálogo =====
        const formPeca = document.getElementById('form-peca');
        const campoFoto = document.getElementById('foto-peca');
        const previaPeca = document.getElementById('previa-peca');
        const campoNomePeca = document.getElementById('nome-peca');
        const campoPreco = document.getElementById('preco-peca');
        const botaoPeca = document.getElementById('botao-peca');
        const cancelarEdicao = document.getElementById('cancelar-edicao');
        const listaPecas = document.getElementById('lista-pecas');
        const semPecas = document.getElementById('sem-pecas');

        let fotoAtual = '';
        let editandoId = null;

        campoFoto.addEventListener('change', async function () {
            const arquivo = campoFoto.files[0];
            if (!arquivo) return;

            try {
                fotoAtual = await reduzirFoto(arquivo);
                mostrarPrevia(previaPeca, fotoAtual);
            } catch (erro) {
                alert('Não consegui ler essa foto. Tente outra.');
            }
        });

        function limparFormularioPeca() {
            formPeca.reset();
            fotoAtual = '';
            mostrarPrevia(previaPeca, '');
            editandoId = null;
            botaoPeca.textContent = 'Salvar peça';
            cancelarEdicao.hidden = true;
        }

        function mostrarPecas() {
            listaPecas.replaceChildren();
            semPecas.hidden = pecas.length > 0;

            pecas.forEach(function (peca) {
                const cartao = criar('article', 'peca');

                if (peca.foto) {
                    const foto = criar('img');
                    foto.src = peca.foto;
                    foto.alt = peca.nome;
                    cartao.append(foto);
                }

                const nome = criar('h3', '', peca.nome);
                const preco = criar('p', 'preco', formatarReais(peca.preco));
                const acoes = criar('div', 'acoes');

                const editar = criar('button', '', 'Editar');
                editar.type = 'button';
                editar.addEventListener('click', function () {
                    editarPeca(peca.id);
                });

                const excluir = criar('button', 'perigo', 'Excluir');
                excluir.type = 'button';
                excluir.addEventListener('click', function () {
                    excluirPeca(peca.id);
                });

                acoes.append(editar, excluir);
                cartao.append(nome, preco, acoes);
                listaPecas.append(cartao);
            });

            preencherCatalogo();
        }

        function editarPeca(id) {
            const peca = pecas.find(function (p) {
                return p.id === id;
            });

            if (!peca) return;

            editandoId = id;
            campoNomePeca.value = peca.nome;
            campoPreco.value = peca.preco;
            fotoAtual = peca.foto || '';
            mostrarPrevia(previaPeca, fotoAtual);

            botaoPeca.textContent = 'Salvar alterações';
            cancelarEdicao.hidden = false;
            formPeca.scrollIntoView({ behavior: 'smooth' });
        }

        function excluirPeca(id) {
            if (!confirm('Excluir esta peça?')) return;

            pecas = pecas.filter(function (p) {
                return p.id !== id;
            });

            salvarPecas();
            mostrarPecas();

            if (editandoId === id) limparFormularioPeca();
        }

        formPeca.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const nome = campoNomePeca.value.trim();
            if (nome === '') return;

            const preco = Number(campoPreco.value) || 0;

            if (editandoId === null) {
                pecas.push({
                    id: Date.now(),
                    nome: nome,
                    preco: preco,
                    foto: fotoAtual
                });
            } else {
                const peca = pecas.find(function (p) {
                    return p.id === editandoId;
                });

                peca.nome = nome;
                peca.preco = preco;
                peca.foto = fotoAtual;
            }

            if (!salvarPecas()) {
                pecas = carregarLista('pecas');
                mostrarPecas();
                return;
            }

            mostrarPecas();
            limparFormularioPeca();
        });

        cancelarEdicao.addEventListener('click', limparFormularioPeca);

   // ===== Atualizar todas as telas =====
        function atualizarTudo() {
            mostrarListaAdicionar();
            mostrarClientes();
            mostrarReceber();
            mostrarVendas();

            if (buscarCliente(clienteAtualId)) {
                mostrarFicha();
            }
        }

function enterParaProximoCampo(formulario) {
    formulario.addEventListener('keydown', function (evento) {
        if (evento.key !== 'Enter') return;
       if (evento.target.tagName !== 'INPUT' && evento.target.tagName !== 'SELECT') return;

        const campos = Array.from(
            formulario.querySelectorAll('input:not([type="file"]), select')
        );

        const posicao = campos.indexOf(evento.target);
        if (posicao === -1) return;

        if (posicao < campos.length - 1) {
            evento.preventDefault();
            campos[posicao + 1].focus();
        }
    });
}

document.querySelectorAll('form').forEach(enterParaProximoCampo);

        mostrarPecas();
        atualizarTudo();
        mostrarTela('tela-adicionar');
  
