# Actions on Google: Audio Recorder Demo

This is a simple Assistant Action, built using Dialogflow, to playback an audio recording. The recording is made using a simple web app.

## Setup Instructions

### Before you begin
Make sure to perform these prerequisite steps:

1. Install Firebase SDK Version `4.x.x` with `npm install --global firebase-tools@4.x.x`.
2. Select a project by running `firebase use --add` using alias `default` in the sample directory.

For troubleshooting these steps, you can refer to the latest [setup instructions for Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart).

### Obtain the audio recorder libraries
Copy the following files from [WebAudioRecorder.js](https://github.com/higuma/web-audio-recorder-js) into the `public\javascript` folder:

1. OggVorbisEncoder.min.js.mem
2. WebAudioRecorder.min.js
3. WebAudioRecorderOgg.min.js

### Steps
1. Click on the **Add to Dialogflow** button below and follow the prompts to create a new project:

[![Webhook Boilerplate](https://storage.googleapis.com/dialogflow-oneclick/deploy.svg "Webhook Boilerplate")](https://console.dialogflow.com/api-client/#/oneclick?templateUrl=https://storage.googleapis.com/dialogflow-oneclick/dialogflow-agent-audio-recorder.zip&agentName=AudioDemo)

1. Click on the gear icon to see the `Project ID` in the settings.
1. Go to the [Firebase console](https://console.firebase.google.com) and select the project that was created.
   1. In the *Database* section, click *Create database* under `Cloud Firestore`.
   1. Select *Locked mode* for the Cloud Firestore Security Rules and then click *Enable*.
   1. In the *Authentication* section, under the Sign in method tab, enable the Google sign-in method and click Save.
      1. Make sure `One account per email address` is set to `Prevent creation of multiple accounts with the same email address` which should be selected by default.
   1. From the project overview page in the Firebase console, click *Add Firebase to your web app*.
1. Go to the command line to publish the project to Firebase Hosting:
   1. Run `firebase deploy` to deploy the project.
   1. Take note of the hosting URL where the project has been published. It should look like `https://${PROJECT}.firebaseapp.com`
1. Test the audio recorder web app:
   1. Load the hosting URL in a browser.
   1. Click on the Google sign-in button to login into the web app.
   1. Click on the microphone button and give the browser permission to record audio.
   1. Say a few words and then click on the microphone button again to stop recording.
1. In Dialogflow, on the left navigation menu in Dialogflow click on *Fulfillment*.
1. Click on the *Deploy* button and wait for the deployment to complete.
1. Select *Integrations* from the left navigation menu and open the *Integration Settings* menu for Actions on Google.
1. Enable *Auto-preview changes* and Click *Test*. This will open the Actions on Google simulator.
1. Type `Talk to my test app` in the simulator, or say `OK Google, talk to my test app` to any Actions on Google enabled device signed into your developer account.

For more detailed information on deployment, see the [documentation](https://developers.google.com/actions/dialogflow/deploy-fulfillment).

### References & Issues
+ Questions? Go to [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google), [Public Issue Tracker](https://issuetracker.google.com) or [Support](https://developers.google.com/actions/support/).
+ For bugs, please report an issue on [Github](https://github.com/dialogflow/dialogflow-fulfillment-nodejs/issues).
+ Actions on Google [Webhook Template](https://github.com/actions-on-google/dialogflow-webhook-template-nodejs).
+ [Codelabs](https://codelabs.developers.google.com/?cat=Assistant) for Actions on Google.
+ Actions on Google [Documentation](https://developers.google.com/actions/extending-the-assistant).
+ For more info on deploying with [Firebase](https://developers.google.com/actions/dialogflow/deploy-fulfillment).
+ Actions on Google [NPM module](https://github.com/actions-on-google/actions-on-google-nodejs).

## Make Contributions
Please read and follow the steps in the CONTRIBUTING.md

## License
See LICENSE

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).

## Google+
Actions on Google Developers Community on Google+ [https://g.co/actionsdev](https://g.co/actionsdev).
