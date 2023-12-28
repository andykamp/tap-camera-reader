import { NextResponse } from "next/server"
import OpenAI from 'openai';
// import { OpenAIStream, StreamingTextResponse } from 'ai';

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log('heiho',);
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
  const response1 = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What does the text in the image say? Give me only the text u see and no other comment from you." },
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

  console.log('img to text', );
  console.log(response1);
  console.log(response1.choices[0]);

  const recipe = response1.choices[0].message.content;
  console.log('recipe',recipe);
  const response2 = await openai.chat.completions.create({
    messages: [{ "role": "system", "content": "You are a helpful nutrition assistant." },
    { "role": "user", "content": "I am making a meal and have written down the recipe for you. I need help to estimate the total calory and protein in the meal. Take the following meal recipe, estimate each items macros (protein, calory) given the listen quantity, and sum it up so i know ish how many proteins and calories the meal contains: Here is the recipe: " + recipe },
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 640,
  });

  console.log('macros', );
  console.log(response2);
  console.dir(response2, { depth: null, color: true });
  console.log('-----', );

  // Respond with the stream
  return NextResponse.json(response2)
}
