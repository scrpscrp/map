import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  constructor(private http: HttpClient) { }
  sendMarkers(markers: any[]): Observable<any> {
    const url = 'https://xxx.com/markers';
    return this.http.post<any>(url, markers);
  }

  getAltitude(marker: L.Marker) {
    const lat = marker.getLatLng().lat;
    const lng = marker.getLatLng().lng;
    const apiKey = 'AIzaSyCNXr-dhJnoekDt8vI6VBxdd63Z36xTbIA';
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${apiKey}`;
    this.http.get(url).subscribe((data: any) => {
      if (data.results.length > 0) {
        const altitude = data.results[0].elevation;
        console.log('Altitude:', altitude);
      } else {
        console.error('No elevation data found.');
      }
    }, error => {
      console.error('Error getting elevation data:', error);
    });
  }
 
}
