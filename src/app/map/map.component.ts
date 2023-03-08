import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component , OnInit} from '@angular/core';
import * as L from 'leaflet'; 
import 'leaflet-polylinedecorator';
import { BehaviorSubject, concatMap } from 'rxjs';
import { MarkerService } from './marker.service';



L.Icon.Default.imagePath = 'assets/';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit  {
  showModal$: BehaviorSubject <boolean> = new BehaviorSubject<boolean>(false);
  editModeEnebled$ : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  markerDetails:any;
  map!: L.Map;
  markers: L.Marker[] = [];
  altitude: number = null;
  lat: number = null;
  long: number = null;
  route: L.Polyline;
  routePoints: L.LatLng[] = [];
  polylines: L.Polyline[] = [];
  polylineDecorator: L.PolylineDecorator = null;


  constructor( private cdr: ChangeDetectorRef, private markersService: MarkerService, private http: HttpClient) { }

  ngOnInit() {
    this.initMap();

  }

  private initMap(): void {
  this.map = L.map('map').setView([50.26, 30.30], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(this.map);

  this.map.on('click', (e: L.LeafletMouseEvent) => {
    const icon = L.divIcon({
      className: 'marker-index-icon', 
      html: '<div class="marker-index-label">' + (this.markers.length+1) + '</div>',
    });
    const marker = L.marker(e.latlng, {
      draggable: true,
      icon: icon
    }).addTo(this.map);
    this.markers.push(marker);
    this.routePoints.push(e.latlng);
    this.getAltitude(marker)
    
    
    marker.on('click', () => {
      const latlng = marker.getLatLng();
      const index = this.markers.indexOf(marker);
      this.markerDetails = {
        marker: marker,
        latlng: latlng,
        index: index
      }
      this.showModalMarker(this.markerDetails);
    });
    marker.on('drag', (e: L.LeafletEvent) => {
      const latlng = e.target.getLatLng();
      this.markerDetails.latlng = latlng;
    });

    this.initRoute();
    marker.setIcon(icon);
    });
  }

  private initRoute() {
    this.route = L.polyline(this.routePoints, { color: 'red' }).addTo(this.map);
    this.polylines.push(this.route);
    this.polylineDecorator = L.polylineDecorator(this.route, {
      patterns: [
        {
          offset: '98%',
          repeat: 100,
          symbol: L.Symbol.arrowHead({ pixelSize: 25, headAngle: 80, polygon: false, pathOptions: { color: 'red', weight: 3 } })
        }
      ]
    }).addTo(this.map);
  }
  showModalMarker(marker:any) {
  this.showModal$.next(!!marker)
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

  closeModal() {
    this.showModal$.next(false);
  }

  removeMarker(marker: L.Marker): void {
    const index = this.markers.indexOf(marker);
  if (index !== -1) {
    this.markers.splice(index, 1);
    this.routePoints.splice(index, 1);
    this.markers.forEach((m, i) => {
      const icon = L.divIcon({
        className: 'marker-index-icon',
        html: '<div class="marker-index-label">' + (i + 1) + '</div>',
      });
      m.setIcon(icon);
    });
    this.map.removeLayer(marker);
    this.polylines.forEach(polyline => {
      this.map.removeLayer(polyline);
    });
    this.polylines = [];
    this.closeModal();
    this.initRoute();
  }
  }

  editMarker() {
    this.editModeEnebled$.next(true);
  }
  cancelEditMarker() {
    this.editModeEnebled$.next(false);
  }
  updateEditMarker() {
    this.markers[this.markerDetails.index].setLatLng({
      lat: this.lat,
      lng: this.long
    })
    this.editModeEnebled$.next(false);
    this.closeModal();
  }
  sendMarkers(): void {
    const markers = this.markers.map(marker => {
      return {
        lat: marker.getLatLng().lat,
        lng: marker.getLatLng().lng
      };
    });
    this.markersService.sendMarkers(markers).subscribe(
      response => {
        console.log('Markers sent to server:', response);
      },
      error => {
        console.error('Error sending markers to server:', error);
      }
    );
  }

}
