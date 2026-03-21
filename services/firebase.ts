import firebase from '@react-native-firebase/app';

export const getFirebaseApp = () => {
  if (firebase.apps.length === 0) {
    throw new Error(
      'Firebase has not been initialized. Ensure google-services.json (Android) ' +
      'and/or GoogleService-Info.plist (iOS) are properly configured.'
    );
  }
  return firebase.app();
};

export default firebase;
