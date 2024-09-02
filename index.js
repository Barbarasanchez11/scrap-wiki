const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const app = express();
const port = 3000;

const urlSingers = 'wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';
const urlOrigin = 'https://es.wikipedia.org/';

app.get('/', async (req, res) => {
    try {
        // Hacemos la solicitud a Wikipedia
        const response = await axios.get(urlOrigin + urlSingers);
        
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            
            // Extraemos el título de la página
            const title = $('title').text();
            console.log('Título de la página:', title); // Mostrar título en la consola
            
            // Extraemos los enlaces de los músicos de rap que se guardan en links
            const links = [];
            $('#mw-pages a').each((index, element) => {
                const link = $(element).attr('href');
                links.push(link);
            });

            const results = [];
            const promises = links.map(pageUrl => {
                return axios.get(`https://es.wikipedia.org${pageUrl}`).then(pageResponse => {
                    const pageHtml = pageResponse.data;
                    const $page = cheerio.load(pageHtml);
                    
                    const title2 = $page('h1').text();
                    const images = [];
                    $page('img').each((index, element) => {
                        images.push($page(element).attr('src'));
                    });
                    const texts = [];
                    $page('p').each((index, element) => {
                        texts.push($page(element).text());
                    });
                    
                    results.push({ title: title2, images, texts });
                });
            });

            // Esperamos a que todas las promesas se resuelvan
            await Promise.all(promises);

            // Enviar título y enlaces como respuesta
            res.json({ title, singersLinks: links.map(link => urlOrigin + link), results });
        } else {
            res.status(response.status).send('No se pudo obtener la página');
        }
    } catch (error) {
        console.error('Error al hacer la solicitud:', error);
        res.status(500).send('Se produjo un error al hacer la solicitud');
    }
});

app.listen(port, () => {
    console.log(`El servidor está escuchando en http://localhost:${port}`);
});
