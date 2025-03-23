import OpenAI from "openai";
import { imageToBase64 } from "./utils";
import z from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { REASON_FIRST, ANSWER_FIRST } from "./prompt";
import 'dotenv/config'
import fs from 'fs'

const llm = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
})

const schema = z.object({
    reason: z.string().describe('Your reasoning for the answer. Think step by step.'),
    answer: z.string().describe('The hand written answer of the question'),
})

async function sendRequest(imageURL: string, reasonFirst: boolean): Promise<{
    reason: string,
    answer: string
}> {
    const response = await llm.chat.completions.create({
        model: process.env.MODEL_NAME as string,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${imageToBase64(imageURL)}`,
                        }
                    },
                    {
                        type: 'text',
                        text: reasonFirst ? REASON_FIRST : ANSWER_FIRST
                    }
                ]
            }
        ],
        response_format: zodResponseFormat(schema, 'response_format')
    })
    return JSON.parse(response.choices[0].message.content as string)
}

async function main() {
    console.log('MODEL_NAME:', process.env.MODEL_NAME)
    let ANSWER_FIRST_CORRECT = 0
    let REASON_FIRST_CORRECT = 0
    const ROUNDS = 20

    // Run Answer First 20 times
    for (let i = 0; i < ROUNDS; i++) {
        console.log(`Running Answer First ${i + 1} times`)
        const response = await sendRequest('image/image.png', false)
        if (response.answer === 'Unknown') {
            ANSWER_FIRST_CORRECT++
        }
        fs.appendFileSync('log.txt', `${JSON.stringify(response)}\n`)
    }
    fs.appendFileSync('log.txt', `\n\n`)

    // Run Reason First 20 times
    for (let i = 0; i < ROUNDS; i++) {
        console.log(`Running Reason First ${i + 1} times`)
        const response = await sendRequest('image/image.png', true)
        if (response.answer === 'Unknown') {
            REASON_FIRST_CORRECT++
        }
        fs.appendFileSync('log.txt', `${JSON.stringify(response)}\n`)
    }

    // Result in Percentage
    const ANSWER_FIRST_CORRECT_PERCENTAGE = (ANSWER_FIRST_CORRECT / ROUNDS) * 100
    const REASON_FIRST_CORRECT_PERCENTAGE = (REASON_FIRST_CORRECT / ROUNDS) * 100
    console.log(`Answer First Correct: ${ANSWER_FIRST_CORRECT_PERCENTAGE}%`)
    console.log(`Reason First Correct: ${REASON_FIRST_CORRECT_PERCENTAGE}%`)
}

main()