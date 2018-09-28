 'use strict';
// 
// Mainly from https://github.com/MacKentoch/reactNativeBeaconExample
//

 import React, {
   Component
 }                     from 'react';
 import {
   AppRegistry,
   StyleSheet,
   Text,
   ListView,
   View,
   DeviceEventEmitter
 }                     from 'react-native';
 import Beacons        from 'react-native-beacons-manager';

 export class BeaconLocate extends Component {
   constructor(props) {
     super(props);
     // Create our dataSource which will be displayed in the ListView
     var ds = new ListView.DataSource({
       rowHasChanged: (r1, r2) => r1 !== r2 }
     );
     this.state = {
       // region information
       // React Native ListView datasource initialization
       dataSource: ds.cloneWithRows([]),
       pos: undefined,
     };
   }

   componentWillMount() {
     //
     // ONLY non component state aware here in componentWillMount
     //
     Beacons.detectIBeacons();

     Beacons
       .startRangingBeaconsInRegion({
           identifier: 'beacons',
       })
       .then(
         () => console.log('Beacons ranging started succesfully')
       )
       .catch(
         error => console.log(`Beacons ranging not started, error: ${error}`)
       );
   }

   componentDidMount() {
     //
     // component state aware here - attach events
     //
     // Ranging:
     setInterval(() => {
         fetch('http://192.168.1.8:8080/location?userid=TEST')
            .then((data) => data.json())
            .then((data) => this.setState({pos: data}))
            .catch((error) => console.log("error getting position: ", error));
     }, 1000);
     this.beaconsDidRange = DeviceEventEmitter.addListener(
       'beaconsDidRange',
       (data) => {
         fetch('http://192.168.1.8:8080/location/ping?userid=TEST', {
             method: 'POST',
             body: JSON.stringify(data.beacons),
         }).catch((error) => console.log('error notifying server: ', error));
         this.setState({
           dataSource: this.state.dataSource.cloneWithRows(data.beacons)
         });
       }
     );
   }

   componentWillUnMount(){
     this.beaconsDidRange = null;
   }

   render() {
     const { dataSource, pos } =  this.state;
     return (
       <View style={styles.container}>
         <Text style={styles.headline}>
           Position: { pos ? pos[0].toFixed(3) : '?' } x { pos ? pos[1].toFixed(3) : '?' }
         </Text>
         <ListView
           dataSource={ dataSource }
           enableEmptySections={ true }
           renderRow={this.renderRow}
         />
       </View>
     );
   }

   renderRow = rowData => {
     return (
       <View style={styles.row}>
         <Text style={styles.smallText}>
           UUID: {rowData.uuid ? rowData.uuid  : 'NA'}
         </Text>
         <Text style={styles.smallText}>
           Major: {rowData.major ? rowData.major : 'NA'}
         </Text>
         <Text style={styles.smallText}>
           Minor: {rowData.minor ? rowData.minor : 'NA'}
         </Text>
         <Text>
           RSSI: {rowData.rssi ? rowData.rssi : 'NA'}
         </Text>
         <Text>
           Proximity: {rowData.proximity ? rowData.proximity : 'NA'}
         </Text>
         <Text>
           Distance: {rowData.distance ? rowData.distance.toFixed(2) : 'NA'}m
         </Text>
       </View>
     );
   }
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     paddingTop: 60,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#F5FCFF'
   },
   btleConnectionStatus: {
     // fontSize: 20,
     paddingTop: 20
   },
   headline: {
     fontSize: 20,
     paddingTop: 20
   },
   row: {
     padding: 8,
     paddingBottom: 16
   },
   smallText: {
     fontSize: 11
   }
 });
