import { NextResponse } from "next/server"
import OpenAI from 'openai';
// import { OpenAIStream, StreamingTextResponse } from 'ai';

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('heiho', );
  // Extract the `messages` from the body of the request
  const { image_url } = await req.json();
  console.log('image_url', image_url);

  // Request the OpenAI API for the response based on the prompt
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-3.5-turbo',
  //   stream: true,
  //   messages: messages,
  // });

  // @todo: add as stream 
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Write down the entire text you see on this image word for word" },
          {
            type: "image_url",
            image_url: {
              "url": image_url, 
              "detail": "low"
            },
          },
        ],
      },
    ],
    max_tokens: 640,
    //n: 1, // number of alternatives to generate
  });

  console.log(response);
  console.log(response.choices[0]);

  // Respond with the stream
  return NextResponse.json(response)
}
