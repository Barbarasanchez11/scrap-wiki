const cheerio = require('cheerio');
const axios = require('axios');
const express = require('express');
const app = express();

const url = 'https://es.wikipedia.org/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';
const urlBase = 'https://es.wikipedia.org';
const links = [];
const raperos = []; 

// lista de raperos
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            const tituloPrincipal = $('title').text();
        
            // Extraer los enlaces de raperos
            $('#mw-pages a').each((index, element) => {
                const link = $(element).attr('href');
                // Asegurarse de que el enlace sea válido y no esté vacío
                if (link) {
                    links.push(link);
                }
            });
        
            raperos.length = 0;

            // Para cada enlace, obtener la información del rapero
            for (const link of links) {
                try {
                    const raperoResponse = await axios.get(`${urlBase}${link}`);
                    const raperoPagina = cheerio.load(raperoResponse.data);
                    
                    const rapero = {
                        titulo: raperoPagina('h1').text(),
                        imagen: raperoPagina('.imagen img').attr('src'),
                        parrafos: raperoPagina('#mw-content-text').find('p').text(), 
                        url: link.replace('/wiki/', '') // Guardar el identificador del rapero sin el prefijo
                    };
                    
                    raperos.push(rapero);
                } catch (error) {
                    console.error(error);
                    // Podrías considerar continuar si hay un error en la solicitud del rapero
                }
            }
            
            // Mostrar los raperos en la página principal
            res.send(`
                <h1>${tituloPrincipal}</h1>
                <ul>
                    ${raperos.map(rapero => `
                        <li>
                            <a href="/rapero/${rapero.url}">${rapero.titulo}</a>
                        </li>
                    `).join('')}
                </ul>
            `);
        }
    } catch (error) {
        console.error(error);
        res.status(404).send('Página no encontrada');
    }
});

//Ruta dinámica raperos
app.get('/rapero/:id', async (req, res) => { // Agregar ':id' 
    const raperoId = req.params.id; // id capturado en la ruta
    const raperoUrl = `${urlBase}/wiki/${raperoId}`; 

    try {
        const response = await axios.get(raperoUrl);
        if (response.status === 200) {
            const html = response.data;
            res.send(html);
        }
    } catch (error) {
        console.error('Se produjo un error al acceder a la información.', error);
        res.status(500).send('Se produjo un error al acceder a la información.');
    }
});

app.listen(3000, () => {
    console.log('express está escuchando en el puerto http://localhost:3000');
});