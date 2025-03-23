import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  isMakeCollab: boolean = false;
  isjoinCollab: boolean = false;
  roomId = '';
  password = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  
  private localStream: MediaStream | null = null;

  constructor() { }
  private router = inject(Router);
  private http = inject(HttpClient);

  joinCollab(): void {
    this.isjoinCollab = true;
    this.isMakeCollab = false;
    this.resetForm();
  }

  makeCollab(): void {
    this.isMakeCollab = true;
    this.isjoinCollab = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.roomId = '';
    this.password = '';
    this.errorMessage = '';
  }

  private validateForm(): boolean {
    if (!this.roomId.trim()) {
      this.errorMessage = 'Room ID is required';
      return false;
    }
    if (!this.password.trim()) {
      this.errorMessage = 'Password is required';
      return false;
    }
    return true;
  }

  createRoom() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.http.post('http://localhost:3000/create-room', { roomId: this.roomId, password: this.password }).subscribe({
      next: (response: any) => {
        console.log(response);
        if (response.message === 'Room created successfully') {  // ✅ Updated message check
          this.router.navigate(['/host'], { queryParams: { roomId: this.roomId } });
        } else {
          this.errorMessage = 'Failed to create room';
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to create room';
        console.error('Error creating room:', error);
        this.isLoading = false;
      }
    });
    
  }

  joinRoom() {
    if (!this.validateForm()) {
      return;
    }

    try {
      this.http.post(`http://localhost:3000/join-room`, { roomId: this.roomId, password: this.password }).subscribe({
        next: (response: any) => {
          console.log(response);
          if (response.message === 'Joined room successfully') {  // ✅ Updated message check
            this.isLoading = true;
            this.router.navigate(['/member'], { queryParams: { roomId: this.roomId } });
          } else {
            this.errorMessage = 'Invalid room ID or password';
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to join room';
          console.error('Error joining room:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      this.errorMessage = 'Failed to join room';
      console.error('Error joining room:', error);
      this.isLoading = false;
    }
  }

  cancel(): void {
    this.isjoinCollab = false;
    this.isMakeCollab = false;
    this.resetForm();
  }
}
