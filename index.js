/** @format */

import {AppRegistry} from 'react-native';
import { BeaconLocate } from './App.js';
import {name as appName} from './app.json';
import { PermissionsAndroid } from 'react-native';

async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        'title': 'Beacon Location',
        'message': 'We need location information to locate beacons'
      }
    )
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Fine Location Permission Granted")
    } else {
      console.log("Fine Location Permission DENIED")
    }
  } catch (err) {
    console.warn(err)
  }
}

requestLocationPermission();
AppRegistry.registerComponent(appName, () => BeaconLocate);
