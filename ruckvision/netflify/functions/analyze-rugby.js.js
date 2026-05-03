const axios = require('axios');

exports.handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { frames, team, focus } = JSON.parse(event.body);

        if (!frames || !Array.isArray(frames)) {
            return { statusCode: 400, body: JSON.stringify({ error: "Frames requeridos" }) };
        }

        // Limitar a 5 imágenes para ahorrar tokens y tiempo
        const selectedFrames = frames.slice(0, 5).map(f => ({
            type: "image_url",
            image_url: { url: f }
        }));

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto entrenador de Rugby internacional (Nivel World Rugby 4). Analizas fotogramas de jugadas y detectas errores técnicos en rucks, tackles, scrums o pases. Devuelve SIEMPRE un JSON puro."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analiza estos fotogramas de un equipo de rugby (${team}). Foco: ${focus}. 
                                Responde estrictamente en este formato JSON:
                                {
                                    "titulo": "string",
                                    "jugador_probable": "descripción breve del jugador",
                                    "confianza": "0-100%",
                                    "error_principal": "string",
                                    "consecuencia": "string",
                                    "correccion": "string",
                                    "ejercicios": ["ejercicio 1", "ejercicio 2"],
                                    "observaciones": "string"
                                }`
                            },
                            ...selectedFrames
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiAnalysis = JSON.parse(response.data.choices[0].message.content);

        return {
            statusCode: 200,
            body: JSON.stringify(aiAnalysis)
        };

    } catch (error) {
        console.error("Error Backend:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error procesando el análisis con IA" })
        };
    }
};