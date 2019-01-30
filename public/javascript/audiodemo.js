// Copyright 2019, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Track audio recording state and objects
let recording = false;
let recordingStream = null;
let webAudioRecorder = null;

// Canvas dimensions for analyser animation
const WIDTH = 600;
const HEIGHT = 400;
const HEIGHT2 = HEIGHT / 2;
let start = null;
let audioData;
let bufferSize;
let analyser;
let canvas;
let context;

// Initialize Cloud Firestore through Firebase
const db = firebase.firestore();

// Initialize access to Cloud Storage for persisting OGG files
const storageService = firebase.storage();
const storageRef = storageService.ref();
const metadata = {
  contentType: 'audio/ogg'
};

// Initialize the FirebaseUI Widget using Firebase.
// https://github.com/firebase/firebaseui-web
const ui = new firebaseui.auth.AuthUI(firebase.auth());
let user = null;

const MICROPHONE_IMAGE = 'images/microphone.png';
const MICROPHONE_RECORDING_IMAGE = 'images/microphonerecording.png';

// Handle the user clicks of the recording button
const startButton = (event) => {
  console.log('startButton');
  if (user === null) {
    alert('Please sign in to record a message.');
    return;
  }
  if (recording){
    stopRecording();
  } else {
    startRecording();
  }
}

// Animate the audio analyser data using a canvas
const animationStep = (timestamp) => {
  if (recording) {
    requestAnimationFrame(animationStep);
  } else {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    return;
  }
  analyser.getByteTimeDomainData(audioData);

  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.beginPath();
  let xIncrement = WIDTH * 1.0 / bufferSize;
  let x = 0;
  for (let i = 0; i < bufferSize; i++) {
    let v = audioData[i] / 128.0;
    let y = v * HEIGHT2;

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += xIncrement;
  };
  context.stroke();
}

const startRecording = () => {
  console.log('startRecording');

  // Start microphone access
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  navigator.mediaDevices.getUserMedia({audio: true, video:false}).then(function(stream) {
    console.log('getUserMedia');
    recordingStream = stream;

    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(stream);

    // Load the worker for the OGG encoder
    // https://github.com/higuma/web-audio-recorder-js
    webAudioRecorder = new WebAudioRecorder(audioSource, {
      workerDir: 'javascript/',
      encoding: 'ogg',
      onEncoderLoading: (recorder, encoding) => {
        console.log('onEncoderLoading');
      },
      onEncoderLoaded: (recorder, encoding) => {
        console.log('onEncoderLoaded');
      },
      onEncodingProgress: (recorder, progress) => {
        console.log('onEncodingProgress: ' + progress);
      },
      onComplete: (recorder, blob) => {
        console.log('onComplete');
        persistFile(blob);
      }
    });

    webAudioRecorder.setOptions({
      timeLimit: 240, // max number of seconds for recording
      encodeAfterRecord: true, // encode the audio data after recording
      ogg: {
        bitRate: 160 // 160 Hz bitrate
      }
    });

    // Visualize the audio data
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    bufferSize = analyser.frequencyBinCount;
    audioData = new Uint8Array(bufferSize);

    // Start the recording process
    webAudioRecorder.startRecording();
    audioSource.connect(analyser);
    requestAnimationFrame(animationStep);
    recording = true;
    document.getElementById('microphone').src = MICROPHONE_RECORDING_IMAGE;

    console.log('startRecording');
  }).catch((err) => {
    console.log('getUserMedia error: ' +  JSON.stringify(err));
    recording = false;
    document.getElementById('microphone').src = MICROPHONE_IMAGE;
    alert(err.message);
  });
}

const stopRecording = () => {
  console.log('stopRecording');

  // Stop microphone access
  recordingStream.getAudioTracks()[0].stop();

  // Finish the recording and start encoding
  webAudioRecorder.finishRecording();
  recording = false;
  document.getElementById('microphone').src = MICROPHONE_IMAGE;

  console.log('Recording stopped');
}

// Upload the geneerated OGG file to cloud storage.
// https://firebase.google.com/docs/storage/web/upload-files
const persistFile = (blob) => {
  const uploadTask = storageRef.child('files/' + (new Date().toISOString()) + '.ogg').put(blob, metadata);
  uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot) => {
    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
    switch (snapshot.state) {
      case firebase.storage.TaskState.PAUSED:
        console.log('Upload is paused');
        break;
      case firebase.storage.TaskState.RUNNING:
        console.log('Upload is running');
        break;
    }
  }, (error) => {
    // Handle unsuccessful uploads
    console.log(error.message);
    alert(error.message);
  }, () => {
    // Upload completed successfully, now we can get the download URL
   uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
     console.log('File available at: ' + downloadURL);

     // Persist the file URL in Firestore
     db.collection('files').add({
       user: user.uid,
       url: downloadURL,
       timestamp: firebase.firestore.FieldValue.serverTimestamp()
     })
     .then((docRef) => {
       console.log('Document written with ID: ', docRef.id);
     })
     .catch((error) => {
       console.error('Error adding document: ', JSON.stringify(error));
    });
   });
  });
}

// Firebase Auth UI config
const getUiConfig = () => {
  return {
    signInSuccessUrl: '/',
    signInOptions: [
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // Required to enable this provider in One-Tap Sign-up.
        authMethod: 'https://accounts.google.com',
        // Required to enable ID token credentials for this provider.
        clientId: null
      },
    ],
    // Terms of service url/callback.
    tosUrl: '/tos.html',
    // Privacy policy url/callback.
    privacyPolicyUrl: '/privacy.html'
  };
}

const deleteAccount = () => {
  // Delete any data in the DB first
  db.collection('files').where('user','==', user.uid).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      doc.ref.delete();
    });
    firebase.auth().currentUser.delete().catch((error) => {
      console.log('delete error: ' +  JSON.stringify(error));
      if (error.code === 'auth/requires-recent-login') {
        // The user's credential is too old. She needs to sign in again.
        firebase.auth().signOut().then(() => {
          // The timeout allows the message to be displayed after the UI has
          // changed to the signed out state.
          setTimeout(() => {
            alert('Please sign in again to delete your account.');
          }, 1);
        });
      }
    });
  });
};

const handleSignedInUser = (user) => {
  console.log('handleSignedInUser: ' + JSON.stringify(user));
  document.getElementById('sign-out').addEventListener('click', () => {
    firebase.auth().signOut();
  });
  document.getElementById('delete-account').addEventListener(
    'click', () => {
      deleteAccount();
    });
  document.getElementById('user-signed-in').style.display = 'block';
  document.getElementById('user-signed-out').style.display = 'none';
};

/**
 * Displays the UI for a signed out user.
 */
const handleSignedOutUser = () => {
  console.log('handleSignedOutUser');
  document.getElementById('user-signed-in').style.display = 'none';
  document.getElementById('user-signed-out').style.display = 'block';
  ui.start('#firebaseui-auth-container', getUiConfig());
};

window.addEventListener('load', () => {
  // Listen to change in auth state so it displays the correct UI for when
  // the user is signed in or not.
  firebase.auth().onAuthStateChanged((authUser) => {
    user = authUser;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('loaded').style.display = 'block';
    authUser ? handleSignedInUser(authUser) : handleSignedOutUser();
  });

  canvas = document.getElementById('visualizer');
  context = canvas.getContext('2d');
  context.fillStyle = 'rgb(255, 255, 255)';
  context.lineWidth = 2;
  context.strokeStyle = 'rgb(0, 0, 0)';
});
