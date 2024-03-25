/*
    *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
    *
    *  Use of this source code is governed by a BSD-style license
    *  that can be found in the LICENSE file in the root of the source
    *  tree.
    */

    // This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

let mediaRecorder;
let recordedBlobs;
let rec;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const codecPreferences = document.querySelector('#codecPreferences');

const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Start Recording') {
        startRecording();
    } else {
        stopRecording();
        recordButton.textContent = 'Start Recording';
        //codecPreferences.disabled = false;
    }
});


const transButton = document.querySelector('button#trans');
transButton.addEventListener('click', () => {
    if (transButton.innerHTML==="Translation off")
        transButton.innerHTML="Translation on";
    else if (transButton.innerHTML==="Translation on")
        transButton.innerHTML="Translation off";
});


/*
const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
    const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
    const superBuffer = new Blob(recordedBlobs, {type: mimeType});
    recordedVideo.src = null;
    recordedVideo.srcObject = null;
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    recordedVideo.controls = true;
    recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
    const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
    const blob = new Blob(recordedBlobs, {type: mimeType});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = mimeType === 'video/mp4' ? 'test.mp4' : 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
});
*/
function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

/*
function getSupportedMimeTypes() {
    const possibleTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=av01,opus',
    ];
    return possibleTypes.filter(mimeType => {
        return MediaRecorder.isTypeSupported(mimeType);
    });
}
*/

function handlerFunc(stream){
    const mimeType='audio/webm';
    const options={mimeType};
    rec = new MediaRecorder (stream,options) ;
    rec.ondataavailable = e =>{
        audioChunks.push (e.data);
        if (rec.state == "inactive"){
            let blob = new Blob(audioChunks, {type: 'audio/webm'}) ;
            recordedAudio.src = URL.createObjectURL (blob);
            recordedAudio.controls=true; recordedAudio.autoplay=true;
            sendAudio(blob);
        }
    }
    console.log("in hander",rec);
}

function sendAudio(blob) {
    blob=blob[0];
    //const formData = new FormData();
    //formData.append('audio', blob);
    //console.log('sending',formData);
    console.log('sent blob',blob);
    console.log(blob.size);
    document.getElementById("dictated").value="Finished dictating.";
    document.getElementById("generated").value="Generating Summary...";
    document.getElementById("record").disabled=true;

    const header = new Headers();
    header.append('Content-Type', 'audio/webm');
    header.append('trans', transButton.innerHTML==="Translation on");
    //const contentLength = blob.size;
    //header.append('Content-Length', contentLength.toString());


    fetch('/upload-audio', {
        headers: header,
        method: 'POST',
        body: blob,
    })
        .then(response => {
            console.log('Audio sent successfully');
            console.log(response);
            return response.json();
        })
    .then(data=>{
            console.log(data);
            document.getElementById("dictated").value=data.dictated;
            document.getElementById("generated").value=data.summary;
        document.getElementById("record").disabled=false;
        })
        .catch(error => {
            console.error('Error sending audio: ', error);
        });
}

async function startRecording() {
    recordedBlobs = [];
    document.getElementById("dictated").value="Dictating.....";

    navigator.mediaDevices.getUserMedia({audio:
        {
            echoCancellation: {exact: true}
        }
    })
        .then(stream=>handlerFunc(stream));
    console.log("out",rec);
    await sleep(1000);
    /*
        const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
    const options = {mimeType};
    if (mimeType.split(';', 1)[0] === 'video/mp4') {
        // Adjust sampling rate to 48khz.
            const track = window.stream.getAudioTracks()[0];
        const {sampleRate} = track.getSettings();
        if (sampleRate != 48000) {
            track.stop();
            window.stream.removeTrack(track);
            const newStream = await navigator.mediaDevices.getUserMedia({audio: {sampleRate: 48000}});
            window.stream.addTrack(newStream.getTracks()[0]);
        }
    }
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }
    */

        //console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    recordButton.textContent = 'Stop Recording';
    //codecPreferences.disabled = true;
    rec.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
        sendAudio(recordedBlobs);
    };
    rec.ondataavailable = handleDataAvailable;
    rec.start();
    console.log('MediaRecorder started', rec);
}

function stopRecording() {
    rec.stop();
}

function handleSuccess(stream) {
    recordButton.disabled = false;
    console.log('getUserMedia() got stream:', stream);
    window.stream = stream;

    const gumVideo = document.querySelector('video#gum');
    gumVideo.srcObject = stream;

    /*
    getSupportedMimeTypes().forEach(mimeType => {
        const option = document.createElement('option');
        option.value = mimeType;
        option.innerText = option.value;
        codecPreferences.appendChild(option);
    });
    */
    //codecPreferences.disabled = false;
}

async function init(constraints) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        console.error('navigator.getUserMedia error:', e);
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
}

const constraints = {
    audio: {
        echoCancellation: {exact: true}
    },
    video: {
        width: 1280, height: 720
    }
};
console.log('Using media constraints:', constraints);
init(constraints);
/*
    document.querySelector('button#start').addEventListener('click', async () => {
        document.querySelector('button#start').disabled = true;
    });*/
