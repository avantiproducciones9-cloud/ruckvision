exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const frames = body.frames || [];

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta API KEY" })
      };
    }

    const content = [
      {
        type: "text",
        text: `
Sos un analista profesional de rugby.

Analizá estos frames y detectá:
- jugador probable
- error
- consecuencia
- corrección
- ejercicios

Respondé en JSON.
        `
      }
    ];

    frames.forEach(img => {
      content.push({
        type: "image_url",
        image_url: img
      });
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [{ role: "user", content }]
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        analysis: {
          error_principal: data.output_text || "No se pudo analizar"
        }
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};