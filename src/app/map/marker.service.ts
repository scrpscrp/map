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
 
}
