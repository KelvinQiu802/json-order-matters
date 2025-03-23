import fs from 'fs'

export function imageToBase64(image: string) {
    const imageBuffer = fs.readFileSync(image)
    const base64 = imageBuffer.toString('base64')
    return base64
}