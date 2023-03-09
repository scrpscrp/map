import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-polylinedecorator';
import { BehaviorSubject } from 'rxjs';
import { MarkerService } from './marker.service';

L.Icon.Default.imagePath = 'assets/';

interface MarkerDetails {
  marker: L.Marker;
  latlng: L.LatLng;
  index: number;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  showModal$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  editModeEnabled$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  markerDetails: MarkerDetails;
  map!: L.Map;
  markers: L.Marker[] = [];
  altitude: number | null = null;
  lat: number | null = null;
  long: number | null = null;
  route: L.Polyline;
  routePoints: L.LatLng[] = [];
  polylines: L.Polyline[] = [];
  polylineDecorator: L.PolylineDecorator | null = null;

  constructor(private cdr: ChangeDetectorRef, private markersService: MarkerService, private http: HttpClient) {}

  ngOnInit(): void {
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
        html: '<div class="marker-index-label">' + (this.markers.length + 1) + '</div>'
      });
      const marker = L.marker(e.latlng, {
        draggable: true,
        icon: icon
      }).addTo(this.map);
      this.markers.push(marker);
      this.routePoints.push(e.latlng);

      marker.on('click', () => {
        const latlng = marker.getLatLng();
        const index = this.markers.indexOf(marker);
        this.markerDetails = {
          marker: marker,
          latlng: latlng,
          index: index
        };
        this.showModalMarker(this.markerDetails);
      });

      marker.on('drag', (e: L.LeafletEvent) => {
        const latlng = e.target.getLatLng();
        this.markerDetails.latlng = latlng;
      });

      marker.on('dragend', () => {
        this.updateRoutePoints();
      });

      this.initRoute();
      marker.setIcon(icon);
    });
  }

  private initRoute(): void {
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

  showModalMarker(marker: MarkerDetails): void {
    this.showModal$.next(!!marker);
  }
  
  closeModal(): void {
    this.showModal$.next(false);
    this.editModeEnabled$.next(false);
    this.lat = null;
    this.long = null;
  }
  
  removeMarker(marker: L.Marker): void {
    const index = this.markers.indexOf(marker);
    if (index !== -1) {
      this.markers.splice(index, 1);
      this.routePoints.splice(index, 1);
      this.updateMarkerIcons();
      this.removeMarkerFromMap(marker);
      this.removePolylinesFromMap();
      this.initRoute();
    }
  }
  
  updateMarkerIcons(): void {
    this.markers.forEach((marker, index) => {
      const icon = L.divIcon({
        className: 'marker-index-icon',
        html: `<div class="marker-index-label">${index + 1}</div>`,
      });
      marker.setIcon(icon);
    });
  }
  
  removeMarkerFromMap(marker: L.Marker): void {
    this.map.removeLayer(marker);
  }
  
  removePolylinesFromMap(): void {
    this.polylines.forEach(polyline => {
      this.map.removeLayer(polyline);
    });
    this.polylines = [];
    this.polylineDecorator.remove();
  }
  
  editMarker(): void {
    this.editModeEnabled$.next(true);
  }
  
  cancelEditMarker(): void {
    this.editModeEnabled$.next(false);
  }
  
  updateEditMarker(): void {
    const marker = this.markers[this.markerDetails.index];
    marker.setLatLng({ lat: this.lat, lng: this.long });
    this.updateRoutePoints();
    this.editModeEnabled$.next(false);
    this.closeModal();
  }
  
  updateRoutePoints(): void {
    this.removePolylinesFromMap();
    this.routePoints = this.markers.map(marker => marker.getLatLng());
    this.initRoute();
  }
  
  sendMarkers(): void {
    const markers = this.markers.map(marker => ({
      lat: marker.getLatLng().lat,
      lng: marker.getLatLng().lng,
    }));
    this.markersService.sendMarkers(markers).subscribe({
      next: response => console.log('Markers sent to server:', response),
      error: error => console.error('Error sending markers to server:', error),
    });
  }
  
}
