"use client";

import React from 'react';
import type OpenAI from 'openai';

export async function AiImageToText(image_url: string) {
  console.log('fetching',);
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_url }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json() as OpenAI.Chat.Completions.ChatCompletion; // or response.text() if the response is plain text
  console.log(data);
  // Process the data as needed
  return data.choices[0].message.content as string
}

type Props = {
  image_url: string;
}

const OpenaiButton = (props: Props) => {
  const { image_url } = props;
  const handleButtonClick = async () => {
    try {
      const res = await AiImageToText(image_url);
      console.log('res', res);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Fetch Data</button>
    </div>
  );
};

export default OpenaiButton;

