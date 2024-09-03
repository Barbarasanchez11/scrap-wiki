const cheerio = require('cheerio');
const axios = require('axios');
const express = require('express');
const app = express();

const url = 'https://es.wikipedia.org/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';
const urlBase = 'https://es.wikipedia.org';
const links = [];
const raperos = []; 

// Ruta inicial para listar raperos
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
            
            // Limpiar el array de raperos para la siguiente construcción
            raperos.length = 0;

            // Para cada enlace, obtener la información del rapero
            await Promise.all(links.map(async (link) => {
                const raperoResponse = await axios.get(`${urlBase}${link}`);
                const raperoPagina = cheerio.load(raperoResponse.data);
                
                const rapero = {
                    titulo: raperoPagina('h1').text(),
                    imagen: raperoPagina('.imagen img').attr('src'),
                    parafos: raperoPagina('#mw-content-text').find('p').text(),
                    url: link // Guardar el enlace completo
                };
                
                raperos.push(rapero);
            }));
            
            // Mostrar los raperos en la página principal
            res.send(`
                <h1>${tituloPrincipal}</h1>
                <ul>
                    ${raperos.map(rapero => `
                        <li>
                            <a href="/rapero${rapero.url}">${rapero.titulo}</a>
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

// Ruta para mostrar la información de un rapero específico
app.get('/rapero*', async (req, res) => {
    const link = req.originalUrl.replace('/rapero', '');
    try {
        const raperoResponse = await axios.get(`${urlBase}${link}`);
        if (raperoResponse.status === 200) {
            const raperoPagina = cheerio.load(raperoResponse.data);
            
            const rapero = {
                titulo: raperoPagina('h1').text(),
                imagen: raperoPagina('.imagen img').attr('src'),
                parafos: raperoPagina('#mw-content-text').find('p').text()
            };
            
            // info rapero
            res.send(`
                <h1>${rapero.titulo}</h1>
                <p><img src="${rapero.imagen}" alt="${rapero.titulo}"/></p>
                <p>${rapero.parafos}</p>
                <a href="/">Volver a la lista de raperos</a>
            `);
        }
    } catch (error) {
        console.error(error);
        res.status(404).send('Página no encontrada');
    }
});

app.listen(3000, () => {
    console.log(`El servidor está escuahdno en http://localhost:3000`);
});