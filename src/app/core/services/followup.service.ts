import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveFollowupRequest } from '../models/followup.models';

@Injectable({
  providedIn: 'root'
})
export class FollowupService {
  private http = inject(HttpClient);

  saveFollowup(payload: SaveFollowupRequest): Observable<any> {
    return this.http.post<any>('followup/Save_followup', payload);
  }
}


