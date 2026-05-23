const https = require('https');

// Função utilitária para fazer requisição nativa sem usar pacotes externos (fetch/axios)
function fetchViaCEP(cep) {
    return new Promise((resolve, reject) => {
        const url = `https://viacep.com.br/ws/${cep}/json/`;
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error('Erro ao fazer parse da resposta'));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function runTests() {
    console.log('--- Iniciando Testes da API ViaCEP ---');

    // Teste 1: CEP Válido (Praça da Sé)
    try {
        console.log('\nTeste 1: Consultando CEP Válido (01001000)...');
        const validCepData = await fetchViaCEP('01001000');
        
        if (validCepData.logradouro === 'Praça da Sé' && validCepData.localidade === 'São Paulo') {
            console.log('✅ PASSOU: Retornou endereço correto (Praça da Sé, São Paulo).');
        } else {
            console.error('❌ FALHOU: O endereço retornado não corresponde ao esperado.', validCepData);
        }
    } catch (e) {
        console.error('❌ FALHOU: Erro na requisição do Teste 1', e);
    }

    // Teste 2: CEP Inexistente
    try {
        console.log('\nTeste 2: Consultando CEP Inexistente (99999999)...');
        const invalidCepData = await fetchViaCEP('99999999');
        
        if (invalidCepData.erro === "true" || invalidCepData.erro === true) {
            console.log('✅ PASSOU: Retornou erro indicando que o CEP não existe.');
        } else {
            console.error('❌ FALHOU: Não retornou a propriedade "erro" como esperado.', invalidCepData);
        }
    } catch (e) {
        console.error('❌ FALHOU: Erro na requisição do Teste 2', e);
    }

    // Teste 3: Formato Inválido
    try {
        console.log('\nTeste 3: Consultando CEP com formato inválido (ABC)...');
        // A API via cep pode retornar 400 Bad Request para formato inválido
        // Como o https.get não rejeita Promise em 400, precisamos tratar ou simplesmente
        // sabemos que a API via CEP retorna um HTML se o formato for muito bizarro
        const badFormatData = await fetchViaCEP('ABC').catch(e => e);
        
        if (badFormatData instanceof Error) {
            console.log('✅ PASSOU: Requisição rejeitada por formato inválido (Erro de parse JSON esperado).');
        } else if (badFormatData.erro) {
            console.log('✅ PASSOU: Retornou erro explícito.');
        } else {
            console.error('❌ FALHOU: Esperava erro, mas retornou:', badFormatData);
        }
    } catch (e) {
        // Se cair aqui, também passou
        console.log('✅ PASSOU: Retornou erro HTTP ao buscar CEP inválido.');
    }

    console.log('\n--- Testes Finalizados ---');
}

// Executar os testes
runTests();
