import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
  ],
  imports: [
		AppRoutingModule,
    BrowserModule,
		BrowserAnimationsModule,
    FormsModule,
    HttpModule,
  ],
  providers: [],
  bootstrap: []
})
export class AppModule { }
