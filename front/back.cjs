const fs = require('fs');
const OpenAI = require("openai");
const { exec } = require('child_process');
const openai = new OpenAI();
async function transferAudio(req, res) {
    console.log(req);
    const audioBlob = req.body;
    console.log(audioBlob);
    const blobSize = Buffer.byteLength(audioBlob);
    console.log(blobSize);

    // Save audio blob to a file
    fs.writeFile('recorded_audio.webm', audioBlob, 'binary',(err) => {
        if (err) {
            console.error('Error saving audio blob:', err);
            res.status(500).send('Error saving audio blob');
            return;
        }

        console.log('Audio blob saved successfully');

        /*
        // Convert audio to MP3
        exec('ffmpeg -i recorded_audio.ogg -c:a libmp3lame -q:a 2 output.mp3', (error, stdout, stderr) => {
            if (error) {
                console.error('Error converting audio to MP3:', error);
                res.status(500).send('Error converting audio to MP3');
                return;
            }

            console.log('Audio converted to MP3');

            // Read the converted MP3 file
            fs.readFile('output.mp3', (err, data) => {
                if (err) {
                    console.error('Error reading MP3 file:', err);
                    res.status(500).send('Error reading MP3 file');
                    return;
                }

                // Send the binary data of the MP3 file as response
                res.set('Content-Type', 'audio/mpeg');
                res.send(data);

                // Clean up: delete temporary files
                fs.unlink('recorded_audio.ogg', (err) => {
                    if (err) console.error('Error deleting recorded audio:', err);
                });

                fs.unlink('output.mp3', (err) => {
                    if (err) console.error('Error deleting MP3 file:', err);
                });
            });
        });
        */
    });

    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream("recorded_audio.webm"),
        model: "whisper-1",
    });
    console.log(transcription.text);

    const completion = await openai.chat.completions.create({
        messages: [
            //{ role: "system", content: "You are a helpful assistant." },
            //{role:"",content:``},
            {"role": "system", "content":"You are a professional GP doctor, and just finished your consultation with your patient. Now you need to write up a consultation summary to the patient so that they can refer it back when they got home." },
            {"role": "user", "content": `Please summarize the following consultation into a consultation report with given background information without any sectioned structures, use 'we' as in first person view: \nconversation: ${transcription.text}\n`}
        ],
        model: "gpt-4-0125-preview",
    });
    console.log(completion.choices[0]);
    res.status(200).send({'dictated':transcription.text,'summary':completion.choices[0].message.content});
};


module.exports={transferAudio};
